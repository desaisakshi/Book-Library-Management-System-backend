const express = require('express');
const router = express.Router();
const c = require('../controllers/UserController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/profile', c.getProfile.bind(c));
router.put('/profile', c.updateProfile.bind(c));
router.get('/dashboard', c.getDashboard.bind(c));
router.post('/author-request', c.requestAuthorUpgrade.bind(c));
router.get('/', authorize('admin'), c.getAllUsers.bind(c));
router.delete('/:id', authorize('admin'), c.deleteUser.bind(c));

module.exports = router;
