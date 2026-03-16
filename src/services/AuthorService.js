const { Author, User, Book, Manuscript, Review } = require('../models');
const { Op } = require('sequelize');

class AuthorService {
  async getAuthorProfile(authorId) {
    const author = await Author.findByPk(authorId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'avatar'] }]
    });
    if (!author) throw new Error('Author not found');
    return author;
  }

  async getAuthorBooks(authorId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 12, 50);
    const { count, rows } = await Book.findAndCountAll({
      where: { author_id: authorId, is_active: true },
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { books: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async getAuthorManuscripts(authorId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const { count, rows } = await Manuscript.findAndCountAll({
      where: { author_id: authorId },
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { manuscripts: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async submitManuscript(authorId, data) {
    const author = await Author.findByPk(authorId);
    if (!author) throw new Error('Author not found');
    if (!author.is_approved) throw new Error('Author must be approved to submit manuscripts');
    const ms = await Manuscript.create({
      author_id: authorId, title: data.title, genre: data.genre,
      description: data.description, file_url: data.file_url,
      cover_image: data.cover_image, status: 'pending'
    });
    return { manuscript: ms, message: 'Manuscript submitted' };
  }

  async getAuthorMetrics(authorId) {
    const author = await Author.findByPk(authorId);
    if (!author) throw new Error('Author not found');
    const books = await Book.findAll({ where: { author_id: authorId, is_active: true } });
    const bookIds = books.map(b => b.id);
    const reviews = bookIds.length
      ? await Review.findAll({ where: { book_id: { [Op.in]: bookIds }, is_approved: true } })
      : [];
    const totalReads = books.reduce((s, b) => s + (b.read_count || 0), 0);
    const totalRentals = books.reduce((s, b) => s + (b.rental_count || 0), 0);
    const avgRating = books.length
      ? (books.reduce((s, b) => s + (parseFloat(b.average_rating) || 0), 0) / books.length).toFixed(2) : '0.00';
    return {
      totalBooks: books.length, totalReads, totalRentals, averageRating: avgRating,
      totalReviews: reviews.length,
      books: books.map(b => ({ id: b.id, title: b.title, reads: b.read_count, rentals: b.rental_count, rating: b.average_rating }))
    };
  }

  async getPendingRequests(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const { count, rows } = await Author.findAndCountAll({
      where: { is_approved: false },
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name', 'avatar'] }],
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { authors: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async approveAuthor(authorId, approved, adminId) {
    const author = await Author.findByPk(authorId);
    if (!author) throw new Error('Author not found');
    await author.update({
      is_approved: approved,
      approved_by: approved ? adminId : null,
      approved_at: approved ? new Date() : null
    });
    if (approved) {
      const user = await User.findByPk(author.user_id);
      if (user) await user.update({ role: 'author' });
    }
    return { author, message: approved ? 'Author approved' : 'Author request rejected' };
  }
}

module.exports = new AuthorService();
