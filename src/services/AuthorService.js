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

  async getAllAuthors(query = {}) {
    const { page = 1, limit = 50, search, approved } = query;
    const dbLimit = Math.min(parseInt(limit, 10) || 50, 100);
    const offset = (parseInt(page, 10) - 1) * dbLimit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${search}%` } },
        { biography: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (approved !== undefined) {
      where.is_approved = approved === 'true';
    }

    const { count, rows } = await Author.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'first_name', 'last_name', 'avatar'],
          required: true
        }
      ],
      order: [['created_at', 'DESC']],
      limit: dbLimit,
      offset
    });

    return {
      authors: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: dbLimit,
        total: count,
        totalPages: Math.ceil(count / dbLimit)
      }
    };
  }

  async createAuthor(data) {
    const { user_id, biography, qualifications, experience, photo, is_approved = true } = data;
    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) throw new Error('User not found');
    // Check if author already exists for this user
    const existing = await Author.findOne({ where: { user_id } });
    if (existing) throw new Error('Author already exists for this user');
    const author = await Author.create({
      user_id,
      biography,
      qualifications,
      experience,
      photo,
      is_approved,
      approved_by: is_approved ? data.approved_by || null : null,
      approved_at: is_approved ? new Date() : null
    });
    // Update user role to author if approved
    if (is_approved) {
      await user.update({ role: 'author' });
    }
    return { author, message: 'Author created successfully' };
  }

  async updateAuthor(authorId, data) {
    const author = await Author.findByPk(authorId);
    if (!author) throw new Error('Author not found');
    // Prevent updating user_id (should be immutable)
    if (data.user_id) delete data.user_id;
    // If updating approval status, handle approved_by/approved_at
    if (data.is_approved !== undefined) {
      if (data.is_approved && !author.is_approved) {
        data.approved_by = data.approved_by || null;
        data.approved_at = new Date();
        // Update user role
        const user = await User.findByPk(author.user_id);
        if (user) await user.update({ role: 'author' });
      } else if (!data.is_approved && author.is_approved) {
        data.approved_by = null;
        data.approved_at = null;
        // Optionally revert user role? We'll keep as author for now.
      }
    }
    await author.update(data);
    return { author, message: 'Author updated successfully' };
  }

  async deleteAuthor(authorId) {
    const author = await Author.findByPk(authorId);
    if (!author) throw new Error('Author not found');
    // Check if author has books (optional, we can decide to block deletion)
    const bookCount = await Book.count({ where: { author_id: authorId } });
    if (bookCount > 0) {
      throw new Error('Cannot delete author with existing books');
    }
    // Delete manuscripts associated with author
    await Manuscript.destroy({ where: { author_id: authorId } });
    // Delete author
    await author.destroy();
    return { message: 'Author deleted successfully' };
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
