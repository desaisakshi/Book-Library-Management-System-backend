const { Book, Author, User, Review, sequelize } = require('../models');
const { Op } = require('sequelize');

class BookService {
  async createBook(authorId, data) {
    const { title, genre, description, isbn, publication_date, cover_image, pdf_url, total_copies } = data;
    if (!title ) throw new Error('Title and genre are required');
    if (isbn && await Book.findOne({ where: { isbn } })) throw new Error('ISBN already exists');

    const copies = parseInt(total_copies, 10) || 0;
    const book = await Book.create({
      author_id: authorId, title, genre, description, isbn,
      publication_date, cover_image, pdf_url,
      total_copies: copies, available_copies: copies
    });
    return { book, message: 'Book created successfully' };
  }

  async getBookById(bookId) {
    const book = await Book.findByPk(bookId, {
      include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }] }]
    });
    if (!book) throw new Error('Book not found');
    return book;
  }

  async getAllBooks(query = {}) {
    const { page = 1, limit = 12, search, genre, author, minRating, sortBy, sortOrder } = query;
    const dbLimit = Math.min(parseInt(limit, 10) || 12, 50);
    const offset = (parseInt(page, 10) - 1) * dbLimit;

    const where = { is_active: true };
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (author) where.author_id = author;
    if (minRating) where.average_rating = { [Op.gte]: parseFloat(minRating) };

    const validSort = ['title', 'average_rating', 'rental_count', 'read_count', 'wishlist_count', 'created_at', 'available_copies'];
    const order = validSort.includes(sortBy)
      ? [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']]
      : [['created_at', 'DESC']];

    const { count, rows } = await Book.findAndCountAll({
      where,
      include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }],
      order, limit: dbLimit, offset, distinct: true
    });
    return { books: rows, pagination: { page: parseInt(page, 10), limit: dbLimit, total: count, totalPages: Math.ceil(count / dbLimit) } };
  }

  async updateBook(bookId, data) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');
    delete data.author_id; delete data.average_rating; delete data.review_count;
    await book.update(data);
    return { book, message: 'Book updated successfully' };
  }

  async deleteBook(bookId) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');
    await book.update({ is_active: false });
    return { message: 'Book deleted successfully' };
  }

  async getGenres() {
    const genres = await Book.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('genre')), 'genre']],
      where: { is_active: true }, raw: true
    });
    return genres.map(g => g.genre).filter(Boolean);
  }

  async readBook(bookId) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');
    if (!book.pdf_url) throw new Error('PDF not available for this book');
    await book.increment('read_count');
    return { bookId: book.id, pdfUrl: book.pdf_url, title: book.title };
  }

  async getPopularBooks(type = 'rented', limit = 10) {
    const fieldMap = { rented: 'rental_count', read: 'read_count', wishlisted: 'wishlist_count', rated: 'average_rating' };
    const orderField = fieldMap[type] || 'rental_count';
    return Book.findAll({
      where: { is_active: true },
      include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }],
      order: [[orderField, 'DESC']],
      limit: parseInt(limit, 10) || 10
    });
  }

  async getBookReviews(bookId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
    const { count, rows } = await Review.findAndCountAll({
      where: { book_id: bookId, is_approved: true },
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'avatar'] }],
      order: [['created_at', 'DESC']],
      limit, offset: (page - 1) * limit
    });
    return { reviews: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }
}

module.exports = new BookService();
