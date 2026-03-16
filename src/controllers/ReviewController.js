const reviewService = require('../services/ReviewService');
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const err = (res, e, code = 400) => res.status(code).json({ success: false, message: e.message });

class ReviewController {
  async createReview(req, res) {
    const { book_id, rating, comment } = req.body;
    if (!book_id || !rating) return err(res, new Error('book_id and rating required'));
    try { ok(res, await reviewService.createReview(req.user.id, book_id, { rating, comment }), 201); }
    catch (e) { err(res, e); }
  }
  async getReviewById(req, res) {
    try { ok(res, await reviewService.getReviewById(req.params.id)); } catch (e) { err(res, e, 404); }
  }
  async getUserReviews(req, res) {
    try { ok(res, await reviewService.getUserReviews(req.user.id, req.query)); } catch (e) { err(res, e); }
  }
  async getAllReviews(req, res) {
    try { ok(res, await reviewService.getAllReviews(req.query)); } catch (e) { err(res, e); }
  }
  async moderateReview(req, res) {
    const { approved } = req.body;
    if (approved === undefined) return err(res, new Error('approved required'));
    try { ok(res, await reviewService.moderateReview(req.params.id, approved)); } catch (e) { err(res, e); }
  }
  async deleteReview(req, res) {
    try { ok(res, await reviewService.deleteReview(req.params.id, req.user.id, req.user.role)); }
    catch (e) { err(res, e); }
  }
}
module.exports = new ReviewController();
