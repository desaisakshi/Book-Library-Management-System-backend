const rentalService = require('../services/RentalService');
const ok = (res, data) => res.json({ success: true, data });
const err = (res, e, code = 400) => res.status(code).json({ success: false, message: e.message });

class RentalController {
  async requestRental(req, res) {
    const { book_id } = req.body;
    if (!book_id) return res.status(400).json({ success: false, message: 'book_id required' });
    try { res.status(201).json({ success: true, data: await rentalService.requestRental(req.user.id, book_id) }); }
    catch (e) { err(res, e); }
  }
  async getUserRentals(req, res) {
    try { ok(res, await rentalService.getUserRentals(req.user.id, req.query)); } catch (e) { err(res, e); }
  }
  async getRentalById(req, res) {
    try { ok(res, await rentalService.getRentalById(req.params.id)); } catch (e) { err(res, e, 404); }
  }
  async dispatchRental(req, res) {
    try { ok(res, await rentalService.dispatchRental(req.params.id, req.user.id)); } catch (e) { err(res, e); }
  }
  async initiateReturn(req, res) {
    try { ok(res, await rentalService.initiateReturn(req.params.id, req.user.id)); } catch (e) { err(res, e); }
  }
  async confirmReturn(req, res) {
    try { ok(res, await rentalService.confirmReturn(req.params.id, req.user.id)); } catch (e) { err(res, e); }
  }
  async cancelRental(req, res) {
    try { ok(res, await rentalService.cancelRental(req.params.id, req.user.id)); } catch (e) { err(res, e); }
  }
  async getAllRentals(req, res) {
    try { ok(res, await rentalService.getAllRentals(req.query)); } catch (e) { err(res, e); }
  }
  async getOverdueRentals(req, res) {
    try { ok(res, await rentalService.getOverdueRentals()); } catch (e) { err(res, e); }
  }
  async getRentalStats(req, res) {
    try { ok(res, await rentalService.getRentalStats()); } catch (e) { err(res, e); }
  }
}
module.exports = new RentalController();
