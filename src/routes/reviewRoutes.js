const express = require('express');
const router = express.Router();
const c = require('../controllers/ReviewController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my-reviews', authenticate, c.getUserReviews.bind(c));
router.get('/admin/all', authenticate, authorize('admin'), c.getAllReviews.bind(c));
router.post('/admin/:id/moderate', authenticate, authorize('admin'), c.moderateReview.bind(c));
router.post('/', authenticate, c.createReview.bind(c));
router.get('/:id', c.getReviewById.bind(c));
router.delete('/:id', authenticate, c.deleteReview.bind(c));

module.exports = router;
