const express = require('express');
const router = express.Router();
const c = require('../controllers/BookController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, c.getAllBooks.bind(c));
router.get('/genres/list', c.getGenres.bind(c));
router.get('/popular/:type', c.getPopularBooks.bind(c));
router.get('/:id/reviews', c.getBookReviews.bind(c));
router.get('/:id/read', authenticate, c.readBook.bind(c));
router.get('/:id', optionalAuth, c.getBookById.bind(c));
router.post('/', authenticate, authorize('admin', 'author'), c.createBook.bind(c));
router.put('/:id', authenticate, authorize('admin', 'author'), c.updateBook.bind(c));
router.delete('/:id', authenticate, authorize('admin'), c.deleteBook.bind(c));

module.exports = router;
