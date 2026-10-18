import Expense from '../models/Expense.js';

// @desc    Get category distribution
// @route   GET /api/analytics/categories
// @access  Private
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: req.user._id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const data = await Expense.aggregate([
      { $match: match },
      {
        $project: {
          date: 1,
          itemsToAggregate: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] },
              then: '$items',
              else: [{ category: '$category', totalPrice: '$amount' }],
            },
          },
        },
      },
      { $unwind: '$itemsToAggregate' },
      {
        $group: {
          _id: '$itemsToAggregate.category',
          total: { $sum: '$itemsToAggregate.totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly spending trends (last 6 months)
// @route   GET /api/analytics/monthly
// @access  Private
export const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const since = new Date();
    since.setMonth(since.getMonth() - months + 1);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const data = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: since } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format into readable month labels
    const formatted = data.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      }),
      year: item._id.year,
      monthNum: item._id.month,
      total: item.total,
      count: item.count,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top merchants by spend
// @route   GET /api/analytics/merchants
// @access  Private
export const getTopMerchants = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { startDate, endDate } = req.query;
    const match = { userId: req.user._id };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const data = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$merchant',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          category: { $first: '$category' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment method breakdown
// @route   GET /api/analytics/payment-methods
// @access  Private
export const getPaymentMethodUsage = async (req, res, next) => {
  try {
    const data = await Expense.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare this month vs last month
// @route   GET /api/analytics/comparison
// @access  Private
export const getSpendingComparison = async (req, res, next) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const createCategoryPipeline = (dateQuery) => [
      { $match: { userId: req.user._id, date: dateQuery } },
      {
        $project: {
          itemsToAggregate: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$items', []] } }, 0] },
              then: '$items',
              else: [{ category: '$category', totalPrice: '$amount' }],
            },
          },
        },
      },
      { $unwind: '$itemsToAggregate' },
      {
        $group: {
          _id: '$itemsToAggregate.category',
          total: { $sum: '$itemsToAggregate.totalPrice' },
          count: { $sum: 1 },
        },
      },
    ];

    const [thisMonth, lastMonth] = await Promise.all([
      Expense.aggregate(createCategoryPipeline({ $gte: thisMonthStart })),
      Expense.aggregate(createCategoryPipeline({ $gte: lastMonthStart, $lte: lastMonthEnd })),
    ]);

    // Build comparison map
    const categories = new Set([
      ...thisMonth.map((x) => x._id),
      ...lastMonth.map((x) => x._id),
    ]);

    const comparison = Array.from(categories).map((cat) => {
      const current = thisMonth.find((x) => x._id === cat)?.total || 0;
      const previous = lastMonth.find((x) => x._id === cat)?.total || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 100;
      return { category: cat, current, previous, changePercent: Math.round(change) };
    });

    const totalThis = thisMonth.reduce((s, x) => s + x.total, 0);
    const totalLast = lastMonth.reduce((s, x) => s + x.total, 0);

    res.json({
      success: true,
      data: {
        thisMonth: { total: totalThis, breakdown: thisMonth },
        lastMonth: { total: totalLast, breakdown: lastMonth },
        comparison,
        overallChange: totalLast > 0 ? Math.round(((totalThis - totalLast) / totalLast) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent transactions for dashboard
// @route   GET /api/analytics/recent
// @access  Private
export const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const expenses = await Expense.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};
