import express from 'express';
import {
  getAnalyticsOverview,
  getSalesChartData,
  getTopProducts,
  getCategoryPerformance,
  getUserGrowth,
} from '../controllers/analytics.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', protect, admin, getAnalyticsOverview);
router.get('/sales-chart', protect, admin, getSalesChartData);
router.get('/top-products', protect, admin, getTopProducts);
router.get('/category-performance', protect, admin, getCategoryPerformance);
router.get('/user-growth', protect, admin, getUserGrowth);

export default router;
