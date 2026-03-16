const express = require('express');
const router = express.Router();
const c = require('../controllers/WishlistController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/admin/most-wishlisted', authorize('admin'), c.getMostWishlisted.bind(c));
router.get('/', c.getUserWishlist.bind(c));
router.post('/', c.addToWishlist.bind(c));
router.get('/:bookId/check', c.checkWishlist.bind(c));
router.delete('/:bookId', c.removeFromWishlist.bind(c));

module.exports = router;
