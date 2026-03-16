const { Wishlist, Book, Author, User } = require('../models');

class WishlistService {
  async addToWishlist(userId, bookId) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');
    const existing = await Wishlist.findOne({ where: { user_id: userId, book_id: bookId } });
    if (existing) throw new Error('Book already in wishlist');
    await Wishlist.create({ user_id: userId, book_id: bookId });
    await book.increment('wishlist_count');
    return { message: 'Book added to wishlist' };
  }

  async removeFromWishlist(userId, bookId) {
    const item = await Wishlist.findOne({ where: { user_id: userId, book_id: bookId } });
    if (!item) throw new Error('Book not in wishlist');
    await item.destroy();
    const book = await Book.findByPk(bookId);
    if (book && book.wishlist_count > 0) await book.decrement('wishlist_count');
    return { message: 'Book removed from wishlist' };
  }

  async getUserWishlist(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 12, 50);
    const { count, rows } = await Wishlist.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Book, as: 'book',
        include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }]
      }],
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { wishlist: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async isInWishlist(userId, bookId) {
    return !!(await Wishlist.findOne({ where: { user_id: userId, book_id: bookId } }));
  }

  async getMostWishlisted(limit = 10) {
    return Book.findAll({
      where: { is_active: true },
      order: [['wishlist_count', 'DESC']],
      limit: parseInt(limit, 10) || 10,
      include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }]
    });
  }
}

module.exports = new WishlistService();
