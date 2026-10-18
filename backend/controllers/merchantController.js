import MerchantMapping from '../models/MerchantMapping.js';

// @desc    Check if merchant exists for current user
// @route   GET /api/merchants/check?name=McDonald's
// @access  Private
export const checkMerchant = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Merchant name is required' });
    }

    const mapping = await MerchantMapping.findOne({
      userId: req.user._id,
      merchantName: name.toLowerCase().trim(),
    });

    res.json({
      success: true,
      found: !!mapping,
      mapping: mapping || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save or update merchant mapping
// @route   POST /api/merchants
// @access  Private
export const saveMerchantMapping = async (req, res, next) => {
  try {
    const { merchantName, merchantType, category } = req.body;

    if (!merchantName || !merchantType || !category) {
      return res.status(400).json({
        success: false,
        message: 'merchantName, merchantType and category are required',
      });
    }

    const mapping = await MerchantMapping.findOneAndUpdate(
      { userId: req.user._id, merchantName: merchantName.toLowerCase().trim() },
      {
        userId: req.user._id,
        merchantName: merchantName.toLowerCase().trim(),
        displayName: merchantName.trim(),
        merchantType,
        category,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all merchant mappings for the user
// @route   GET /api/merchants
// @access  Private
export const getMerchants = async (req, res, next) => {
  try {
    const mappings = await MerchantMapping.find({ userId: req.user._id }).sort({ displayName: 1 });
    res.json({ success: true, data: mappings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a merchant mapping
// @route   PUT /api/merchants/:id
// @access  Private
export const updateMerchantMapping = async (req, res, next) => {
  try {
    const { merchantType, category } = req.body;
    const mapping = await MerchantMapping.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { merchantType, category },
      { new: true, runValidators: true }
    );

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Merchant mapping not found' });
    }

    res.json({ success: true, data: mapping });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a merchant mapping
// @route   DELETE /api/merchants/:id
// @access  Private
export const deleteMerchantMapping = async (req, res, next) => {
  try {
    const mapping = await MerchantMapping.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Merchant mapping not found' });
    }

    res.json({ success: true, message: 'Merchant mapping deleted' });
  } catch (error) {
    next(error);
  }
};
