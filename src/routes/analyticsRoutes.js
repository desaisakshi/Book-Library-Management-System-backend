const express = require('express');
const router = express.Router();
const c = require('../controllers/AnalyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));
router.get('/overview', c.getSystemOverview.bind(c));
router.get('/books', c.getBookAnalytics.bind(c));
router.get('/authors', c.getAuthorInsights.bind(c));
router.get('/rentals', c.getRentalAnalytics.bind(c));
router.get('/genres', c.getGenreDistribution.bind(c));
router.get('/activity', c.getRecentActivity.bind(c));
router.get('/manuscripts', c.getManuscriptAnalytics.bind(c));

module.exports = router;
