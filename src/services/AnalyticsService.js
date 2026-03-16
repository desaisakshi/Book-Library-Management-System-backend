const { User, Author, Book, Rental, Review, Manuscript, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
  async getSystemOverview() {
    const [totalUsers, totalAuthors, totalBooks, activeRentals, overdueRentals] = await Promise.all([
      User.count(),
      Author.count({ where: { is_approved: true } }),
      Book.count({ where: { is_active: true } }),
      Rental.count({ where: { status: { [Op.in]: ['requested', 'dispatched', 'return_initiated'] } } }),
      Rental.count({ where: { status: 'dispatched', due_date: { [Op.lt]: new Date() } } })
    ]);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.count({ where: { created_at: { [Op.gte]: startOfMonth } } });
    return { totalUsers, totalAuthors, totalBooks, activeRentals, overdueRentals, newUsersThisMonth };
  }

  async getBookAnalytics(type = 'rented') {
    const fieldMap = { rented: 'rental_count', read: 'read_count', wishlisted: 'wishlist_count', rated: 'average_rating' };
    const orderField = fieldMap[type] || 'rental_count';
    return Book.findAll({
      where: { is_active: true },
      attributes: ['id', 'title', 'genre', 'cover_image', 'average_rating', 'read_count', 'rental_count', 'wishlist_count', 'review_count'],
      order: [[orderField, 'DESC']], limit: 20,
      include: [{ model: Author, as: 'author', attributes: ['id'], include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }]
    });
  }

  async getAuthorInsights() {
    const authors = await Author.findAll({
      where: { is_approved: true },
      include: [
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
        { model: Book, as: 'books', attributes: ['id', 'title', 'read_count', 'rental_count', 'average_rating', 'review_count'] }
      ]
    });
    return authors.map(a => {
      const books = a.books || [];
      return {
        authorId: a.id,
        name: `${a.user.first_name} ${a.user.last_name}`,
        email: a.user.email,
        totalBooks: books.length,
        totalReads: books.reduce((s, b) => s + (b.read_count || 0), 0),
        totalRentals: books.reduce((s, b) => s + (b.rental_count || 0), 0),
        totalReviews: books.reduce((s, b) => s + (b.review_count || 0), 0),
        averageRating: books.length
          ? (books.reduce((s, b) => s + (parseFloat(b.average_rating) || 0), 0) / books.length).toFixed(2) : '0.00'
      };
    }).sort((a, b) => (b.totalReads + b.totalRentals) - (a.totalReads + a.totalRentals));
  }

  async getRentalAnalytics() {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // FIX: group by created_at (always set) not rental_date (nullable)
    const rentalsByDay = await Rental.findAll({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
    });

    const statusBreakdown = await Rental.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    });

    const completedRentals = await Rental.findAll({
      where: { status: 'completed', rental_date: { [Op.ne]: null }, return_date: { [Op.ne]: null } },
      attributes: ['rental_date', 'return_date']
    });

    let avgDuration = 0;
    if (completedRentals.length > 0) {
      const total = completedRentals.reduce((s, r) => {
        return s + Math.max(0, Math.ceil((new Date(r.return_date) - new Date(r.rental_date)) / 86400000));
      }, 0);
      avgDuration = total / completedRentals.length;
    }

    return {
      rentalsByDay,
      statusBreakdown: statusBreakdown.reduce((acc, r) => { acc[r.status] = parseInt(r.dataValues.count); return acc; }, {}),
      averageRentalDuration: Math.round(avgDuration)
    };
  }

  async getGenreDistribution() {
    const genres = await Book.findAll({
      where: { is_active: true },
      attributes: ['genre', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('AVG', sequelize.col('average_rating')), 'avgRating']],
      group: ['genre'], order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    return genres.map(g => ({ genre: g.genre, count: parseInt(g.dataValues.count), averageRating: parseFloat(g.dataValues.avgRating) || 0 }));
  }

  async getRecentActivity() {
    const [recentUsers, recentRentals, recentReviews] = await Promise.all([
      User.findAll({ attributes: ['id', 'email', 'role', 'created_at'], order: [['created_at', 'DESC']], limit: 5 }),
      Rental.findAll({ order: [['created_at', 'DESC']], limit: 5, include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }, { model: Book, as: 'book', attributes: ['title'] }] }),
      Review.findAll({ where: { is_approved: true }, order: [['created_at', 'DESC']], limit: 5, include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }, { model: Book, as: 'book', attributes: ['title'] }] })
    ]);
    return { recentUsers, recentRentals, recentReviews };
  }

  async getManuscriptAnalytics() {
    const [pending, approved, rejected] = await Promise.all([
      Manuscript.count({ where: { status: 'pending' } }),
      Manuscript.count({ where: { status: 'approved' } }),
      Manuscript.count({ where: { status: 'rejected' } })
    ]);
    return { pending, approved, rejected };
  }
}

module.exports = new AnalyticsService();
