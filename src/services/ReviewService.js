const { Review, Book, User, Rental } = require('../models');
const { Op } = require('sequelize');

class ReviewService {
  async createReview(userId, bookId, { rating, comment }) {
    if (!rating || rating < 1 || rating > 5) throw new Error('Rating must be 1-5');
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');

    const existing = await Review.findOne({ where: { user_id: userId, book_id: bookId } });
    if (existing) {
      await existing.update({ rating, comment, is_approved: true });
      await this._updateRating(bookId);
      return { review: existing, message: 'Review updated' };
    }

    const review = await Review.create({ user_id: userId, book_id: bookId, rating, comment, is_approved: true });
    await this._updateRating(bookId);
    return { review, message: 'Review submitted' };
  }

  async _updateRating(bookId) {
    const reviews = await Review.findAll({ where: { book_id: bookId, is_approved: true } });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    await Book.update({ average_rating: avg.toFixed(2), review_count: reviews.length }, { where: { id: bookId } });
  }

  async getReviewById(reviewId) {
    const r = await Review.findByPk(reviewId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }, { model: Book, as: 'book', attributes: ['id', 'title'] }]
    });
    if (!r) throw new Error('Review not found');
    return r;
  }

  async getUserReviews(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const { count, rows } = await Review.findAndCountAll({
      where: { user_id: userId },
      include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image'] }],
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { reviews: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async getAllReviews(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const where = {};
    if (query.bookId) where.book_id = query.bookId;
    if (query.isApproved !== undefined) where.is_approved = query.isApproved === 'true';
    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title'] }
      ],
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { reviews: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async moderateReview(reviewId, approved) {
    const r = await Review.findByPk(reviewId);
    if (!r) throw new Error('Review not found');
    await r.update({ is_approved: approved });
    await this._updateRating(r.book_id);
    return { review: r, message: approved ? 'Approved' : 'Rejected' };
  }

  async deleteReview(reviewId, userId, userRole) {
    const r = await Review.findByPk(reviewId);
    if (!r) throw new Error('Review not found');
    if (r.user_id !== userId && userRole !== 'admin') throw new Error('Unauthorized');
    const bookId = r.book_id;
    await r.destroy();
    await this._updateRating(bookId);
    return { message: 'Review deleted' };
  }
}

module.exports = new ReviewService();
