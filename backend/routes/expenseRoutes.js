import express from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadAndExtract,
  saveExtractedExpense,
  getExpenseStats,
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/stats', getExpenseStats);
router.post('/upload', upload.single('file'), uploadAndExtract);
router.post('/save-extracted', saveExtractedExpense);

router.route('/').get(getExpenses).post(createExpense);
router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

export default router;
