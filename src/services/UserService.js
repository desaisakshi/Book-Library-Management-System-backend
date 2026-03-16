const { User, Author, Book, Rental, Review, Wishlist } = require('../models');
const { Op } = require('sequelize');

class UserService {
  async getProfile(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    if (!user) throw new Error('User not found');
    if (user.role === 'author') {
      const authorProfile = await Author.findOne({ where: { user_id: userId } });
      return { ...user.toJSON(), authorProfile };
    }
    return user;
  }

  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    delete data.role; delete data.is_verified; delete data.email; delete data.password_hash;
    await user.update(data);
    return { user: user.toJSON(), message: 'Profile updated' };
  }

  async requestAuthorUpgrade(userId, authorData) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'author') throw new Error('Already an author');
    if (await Author.findOne({ where: { user_id: userId } })) throw new Error('Author request already exists');
    const author = await Author.create({
      user_id: userId,
      biography: authorData.biography,
      qualifications: authorData.qualifications,
      experience: authorData.experience,
      is_approved: false
    });
    return { author, message: 'Author request submitted' };
  }

  async getDashboard(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password_hash'] } });
    if (!user) throw new Error('User not found');

    const [activeRentals, rentalHistory, wishlist, reviews] = await Promise.all([
      Rental.findAndCountAll({
        where: { user_id: userId, status: { [Op.in]: ['requested', 'dispatched', 'return_initiated'] } },
        include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image'] }],
        order: [['created_at', 'DESC']]
      }),
      Rental.findAndCountAll({
        where: { user_id: userId, status: 'completed' },
        include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image'] }],
        order: [['created_at', 'DESC']], limit: 10
      }),
      Wishlist.findAndCountAll({
        where: { user_id: userId },
        include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image', 'average_rating'] }],
        order: [['created_at', 'DESC']]
      }),
      Review.findAndCountAll({
        where: { user_id: userId },
        include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image'] }],
        order: [['created_at', 'DESC']]
      })
    ]);

    return {
      user,
      stats: {
        activeRentals: activeRentals.count,
        booksRead: rentalHistory.count,
        wishlistCount: wishlist.count,
        reviewsCount: reviews.count
      },
      activeRentals: activeRentals.rows,
      rentalHistory: rentalHistory.rows,
      wishlist: wishlist.rows,
      reviews: reviews.rows
    };
  }

  async getAllUsers(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const where = {};
    if (query.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${query.search}%` } },
        { first_name: { [Op.iLike]: `%${query.search}%` } },
        { last_name: { [Op.iLike]: `%${query.search}%` } }
      ];
    }
    if (query.role) where.role = query.role;
    const { count, rows } = await User.findAndCountAll({
      where, attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit
    });
    return { users: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    if (user.role === 'admin') throw new Error('Cannot delete admin');
    await user.destroy();
    return { message: 'User deleted' };
  }
}

module.exports = new UserService();
