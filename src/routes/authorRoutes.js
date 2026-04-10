const express = require('express');
const router = express.Router();
const c = require('../controllers/AuthorController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', c.getAllAuthors.bind(c));
router.post('/', authenticate, authorize('admin'), c.createAuthor.bind(c));
router.put('/:id', authenticate, authorize('admin'), c.updateAuthor.bind(c));
router.delete('/:id', authenticate, authorize('admin'), c.deleteAuthor.bind(c));
router.get('/admin/pending', authenticate, authorize('admin'), c.getPendingRequests.bind(c));
router.post('/admin/:id/approve', authenticate, authorize('admin'), c.approveAuthor.bind(c));
router.post('/manuscripts', authenticate, authorize('author'), c.submitManuscript.bind(c));
router.get('/:id', c.getAuthorProfile.bind(c));
router.get('/:id/books', c.getAuthorBooks.bind(c));
router.get('/:id/manuscripts', authenticate, c.getAuthorManuscripts.bind(c));
router.get('/:id/metrics', authenticate, c.getAuthorMetrics.bind(c));

module.exports = router;
