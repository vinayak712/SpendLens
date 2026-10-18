import express from 'express';
import {
  getCategoryDistribution,
  getMonthlyTrends,
  getTopMerchants,
  getPaymentMethodUsage,
  getSpendingComparison,
  getRecentTransactions,
} from '../controllers/analyticsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/categories', getCategoryDistribution);
router.get('/monthly', getMonthlyTrends);
router.get('/merchants', getTopMerchants);
router.get('/payment-methods', getPaymentMethodUsage);
router.get('/comparison', getSpendingComparison);
router.get('/recent', getRecentTransactions);

export default router;
