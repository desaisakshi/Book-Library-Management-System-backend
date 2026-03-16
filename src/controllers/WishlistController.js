const wishlistService = require('../services/WishlistService');
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const err = (res, e) => res.status(400).json({ success: false, message: e.message });

class WishlistController {
  async addToWishlist(req, res) {
    const { book_id } = req.body;
    if (!book_id) return err(res, new Error('book_id required'));
    try { ok(res, await wishlistService.addToWishlist(req.user.id, book_id), 201); } catch (e) { err(res, e); }
  }
  async removeFromWishlist(req, res) {
    try { ok(res, await wishlistService.removeFromWishlist(req.user.id, req.params.bookId)); } catch (e) { err(res, e); }
  }
  async getUserWishlist(req, res) {
    try { ok(res, await wishlistService.getUserWishlist(req.user.id, req.query)); } catch (e) { err(res, e); }
  }
  async checkWishlist(req, res) {
    try { ok(res, { isInWishlist: await wishlistService.isInWishlist(req.user.id, req.params.bookId) }); }
    catch (e) { err(res, e); }
  }
  async getMostWishlisted(req, res) {
    try { ok(res, await wishlistService.getMostWishlisted(req.query.limit || 10)); } catch (e) { err(res, e); }
  }
}
module.exports = new WishlistController();
