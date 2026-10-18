import express from 'express';
import { askQuestion, getDashboardInsights } from '../controllers/insightsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/ask', askQuestion);
router.get('/dashboard', getDashboardInsights);

export default router;
