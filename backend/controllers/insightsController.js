import Expense from '../models/Expense.js';
import { generateInsights, generateDashboardInsights } from '../services/geminiService.js';

// @desc    Ask AI a financial question
// @route   POST /api/insights/ask
// @access  Private
export const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Fetch last 3 months of expenses for context
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: since },
    }).sort({ date: -1 });

    if (expenses.length === 0) {
      return res.json({
        success: true,
        answer: "You don't have any expenses recorded in the last 3 months. Start by adding some expenses to get personalized insights!",
      });
    }

    try {
      const answer = await generateInsights(expenses, question, req.user);
      res.json({ success: true, answer });
    } catch (aiError) {
      console.error('❌ Gemini Insights Error:', aiError.message || aiError);
      res.json({
        success: true,
        answer: `⚠️ AI Insights Unavailable: ${aiError.message || 'Check your Gemini API Key in backend/.env'}.`,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI dashboard insights
// @route   GET /api/insights/dashboard
// @access  Private
export const getDashboardInsights = async (req, res, next) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 1);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: since },
    }).sort({ date: -1 });

    if (expenses.length === 0) {
      return res.json({
        success: true,
        insights: '💡 No expenses found this month. Add your first expense to get AI-powered insights!',
      });
    }

    try {
      const insights = await generateDashboardInsights(expenses, req.user);
      res.json({ success: true, insights });
    } catch (aiError) {
      console.error('❌ Gemini Dashboard Insights Error:', aiError.message || aiError);
      res.json({
        success: true,
        insights: `⚠️ AI Insights Unavailable: ${aiError.message || 'Check your Gemini API Key in backend/.env'}.`,
      });
    }
  } catch (error) {
    next(error);
  }
};
