import Expense from '../models/Expense.js';
import MerchantMapping from '../models/MerchantMapping.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { extractExpenseFromImage } from '../services/geminiService.js';

// @desc    Get all expenses (with filters, search, pagination)
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      paymentMethod,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'date',
      order = 'desc',
    } = req.query;

    const query = { userId: req.user._id };

    // Search by merchant or notes
    if (search) {
      query.$or = [
        { merchant: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Create expense manually
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const { merchant, amount, date, category, paymentMethod, merchantType, notes } = req.body;

    const expense = await Expense.create({
      userId: req.user._id,
      merchant,
      amount,
      date: date || Date.now(),
      category,
      paymentMethod,
      merchantType: merchantType || 'Business',
      notes,
      source: 'manual',
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload image/PDF and extract expense via Gemini
// @route   POST /api/expenses/upload
// @access  Private
export const uploadAndExtract = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const isPDF = req.file.mimetype === 'application/pdf';
    const resourceType = isPDF ? 'raw' : 'image';

    // Upload to Cloudinary
    let url = '';
    let publicId = '';
    try {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'spendlens/receipts',
        resourceType
      );
      url = uploadResult.url;
      publicId = uploadResult.publicId;
    } catch (cloudErr) {
      console.error('❌ Cloudinary Upload Error:', cloudErr.message || cloudErr);
      return res.status(500).json({
        success: false,
        message: `Image Upload Failed: ${cloudErr.message || 'Invalid Cloudinary credentials in .env'}`,
      });
    }

    let extractedData = null;
    let extractionError = null;

    if (!isPDF) {
      try {
        extractedData = await extractExpenseFromImage(url, req.file.mimetype);
      } catch (geminiErr) {
        console.error('❌ Gemini Extraction Error:', geminiErr.message || geminiErr);
        extractionError = geminiErr.message || 'Gemini AI failed to parse receipt';
      }
    }

    // Check if merchant already has a saved mapping
    let merchantMapping = null;
    if (extractedData?.merchant) {
      merchantMapping = await MerchantMapping.findOne({
        userId: req.user._id,
        merchantName: extractedData.merchant.toLowerCase().trim(),
      });
    }

    res.json({
      success: true,
      data: {
        imageUrl: url,
        imagePublicId: publicId,
        extracted: extractedData,
        extractionError,
        merchantMapping, // null means user needs to classify
        isPDF,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save extracted expense (1 receipt = 1 transaction with nested items)
// @route   POST /api/expenses/save-extracted
// @access  Private
export const saveExtractedExpense = async (req, res, next) => {
  try {
    const {
      merchant,
      amount,
      date,
      category,
      paymentMethod,
      merchantType,
      notes,
      items,
      subtotal,
      tax,
      discount,
      confidence,
      imageUrl,
      imagePublicId,
      source,
    } = req.body;

    const validCategories = [
      'Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Household',
      'Health', 'Shopping', 'Medical', 'Fuel', 'Travel', 'Bills', 'Entertainment',
      'Electronics', 'Education', 'Other', 'Friend', 'Family', 'Rent', 'Loan', 'Salary', 'Gift',
    ];
    const validMethods = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Card', 'Net Banking', 'Other'];

    let method = paymentMethod || 'UPI';
    if (!validMethods.includes(method)) {
      if (/card/i.test(method)) method = 'Card';
      else if (/upi|gpay|phonepe|paytm/i.test(method)) method = 'UPI';
      else if (/cash/i.test(method)) method = 'Cash';
      else method = 'Other';
    }

    let cat = category || 'Other';
    if (!validCategories.includes(cat)) cat = 'Other';

    // Format nested items if present
    const sanitizedItems = Array.isArray(items)
      ? items.map((it) => ({
          name: it.name || it.merchant || 'Item',
          quantity: typeof it.quantity === 'number' ? it.quantity : parseFloat(it.quantity) || 1,
          unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : parseFloat(it.unitPrice) || 0,
          totalPrice: typeof it.totalPrice === 'number' ? it.totalPrice : (typeof it.amount === 'number' ? it.amount : parseFloat(it.totalPrice || it.amount) || 0),
          category: validCategories.includes(it.category) ? it.category : 'Other',
        }))
      : [];

    const expense = await Expense.create({
      userId: req.user._id,
      merchant: merchant || 'Expense',
      amount: parseFloat(amount) || 0,
      date: date || Date.now(),
      category: cat,
      paymentMethod: method,
      merchantType: merchantType || 'Business',
      notes: notes || '',
      items: sanitizedItems,
      subtotal: subtotal !== undefined && subtotal !== null ? parseFloat(subtotal) : null,
      tax: tax !== undefined && tax !== null ? parseFloat(tax) : null,
      discount: discount !== undefined && discount !== null ? parseFloat(discount) : null,
      confidence: confidence || 'high',
      imageUrl: imageUrl || '',
      imagePublicId: imagePublicId || '',
      source: source || 'upload',
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const updatable = ['merchant', 'amount', 'date', 'category', 'paymentMethod', 'merchantType', 'notes'];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) expense[field] = req.body[field];
    });

    await expense.save();
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Remove image from Cloudinary if exists
    if (expense.imagePublicId) {
      await deleteFromCloudinary(expense.imagePublicId);
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense summary stats
// @route   GET /api/expenses/stats
// @access  Private
export const getExpenseStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalResult, monthlyResult, lastMonthResult, totalCount] = await Promise.all([
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.countDocuments({ userId }),
    ]);

    const monthlySpend = monthlyResult[0]?.total || 0;
    const budget = req.user.monthlyBudget || 0;

    res.json({
      success: true,
      data: {
        totalExpenses: totalResult[0]?.total || 0,
        monthlySpending: monthlySpend,
        lastMonthSpending: lastMonthResult[0]?.total || 0,
        budgetRemaining: budget > 0 ? Math.max(0, budget - monthlySpend) : null,
        monthlyBudget: budget,
        totalTransactions: totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
