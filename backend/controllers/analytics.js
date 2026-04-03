import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get comprehensive analytics data
// @route   GET /api/analytics/overview
// @access  Private/Admin
export const getAnalyticsOverview = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));

    // Basic counts
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Revenue calculations
    const allOrders = await Order.find({ isPaid: true });
    const totalRevenue = allOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    
    // Last 30 days revenue
    const recentOrders = await Order.find({ 
      isPaid: true, 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const monthlyRevenue = recentOrders.reduce((acc, order) => acc + order.totalPrice, 0);
    
    // Last 7 days orders
    const weeklyOrders = await Order.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Order status breakdown
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      monthlyRevenue,
      weeklyOrders,
      statusBreakdown: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales chart data (last 30 days)
// @route   GET /api/analytics/sales-chart
// @access  Private/Admin
export const getSalesChartData = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
    const dailySales = await Order.aggregate([
      { 
        $match: { 
          isPaid: true, 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sales: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const formattedData = dailySales.map(day => ({
      date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
      sales: day.sales,
      orders: day.orders
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top selling products
// @route   GET /api/analytics/top-products
// @access  Private/Admin
export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category performance
// @route   GET /api/analytics/category-performance
// @access  Private/Admin
export const getCategoryPerformance = async (req, res) => {
  try {
    const categoryStats = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          totalQuantity: { $sum: '$orderItems.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(categoryStats.map(cat => ({
      category: cat._id,
      orders: cat.totalOrders,
      revenue: cat.totalRevenue,
      quantity: cat.totalQuantity
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user growth data
// @route   GET /api/analytics/user-growth
// @access  Private/Admin
export const getUserGrowth = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date(today.setMonth(today.getMonth() - 6));
    
    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedData = monthlyUsers.map(month => ({
      month: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
      users: month.newUsers
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
