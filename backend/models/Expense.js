import mongoose from 'mongoose';

const receiptItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      required: [true, 'Merchant name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        // Business & Receipt categories
        'Food', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Household',
        'Health', 'Shopping', 'Medical', 'Fuel', 'Travel', 'Bills', 'Entertainment',
        'Electronics', 'Education', 'Other',
        // Person categories
        'Friend', 'Family', 'Rent', 'Loan', 'Salary', 'Gift',
      ],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Card', 'Net Banking', 'Other'],
      default: 'UPI',
    },
    merchantType: {
      type: String,
      enum: ['Person', 'Business'],
      default: 'Business',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    items: {
      type: [receiptItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: null,
    },
    tax: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: null,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'high',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['manual', 'upload', 'pdf'],
      default: 'manual',
    },
    rawExtractedData: {
      type: mongoose.Schema.Types.Mixed, // store raw Gemini response
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast queries by user + date
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
