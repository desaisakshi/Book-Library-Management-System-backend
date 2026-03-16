const express = require('express');
const router = express.Router();
const c = require('../controllers/RentalController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin/all', authenticate, authorize('admin'), c.getAllRentals.bind(c));
router.get('/admin/overdue', authenticate, authorize('admin'), c.getOverdueRentals.bind(c));
router.get('/admin/stats', authenticate, authorize('admin'), c.getRentalStats.bind(c));
router.post('/', authenticate, c.requestRental.bind(c));
router.get('/', authenticate, c.getUserRentals.bind(c));
router.get('/:id', authenticate, c.getRentalById.bind(c));
router.post('/:id/return', authenticate, c.initiateReturn.bind(c));
router.post('/:id/dispatch', authenticate, authorize('admin'), c.dispatchRental.bind(c));
router.post('/:id/confirm-return', authenticate, authorize('admin'), c.confirmReturn.bind(c));
router.delete('/:id', authenticate, c.cancelRental.bind(c));

module.exports = router;
