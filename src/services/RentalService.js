const { Rental, Book, User, Author } = require('../models');
const { Op } = require('sequelize');
const { sendRentalConfirmationEmail, sendDispatchEmail, sendReturnConfirmationEmail } = require('../utils/emailService');

class RentalService {
  async requestRental(userId, bookId) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error('Book not found');
    if (book.available_copies <= 0) throw new Error('No copies available');

    const existing = await Rental.findOne({
      where: { user_id: userId, book_id: bookId, status: { [Op.in]: ['requested', 'dispatched', 'return_initiated'] } }
    });
    if (existing) throw new Error('You already have an active rental for this book');

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const rental = await Rental.create({
      user_id: userId, book_id: bookId, status: 'requested',
      rental_date: new Date(), due_date: dueDate
    });

    // Non-blocking email — won't crash rental if email fails
    User.findByPk(userId).then(user => {
      if (user) sendRentalConfirmationEmail(user, rental, book).catch(() => {});
    });

    return { rental, message: 'Rental request submitted successfully' };
  }

  async getRentalById(rentalId) {
    const rental = await Rental.findByPk(rentalId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Book, as: 'book', include: [{ model: Author, as: 'author', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }] }
      ]
    });
    if (!rental) throw new Error('Rental not found');
    return rental;
  }

  async getUserRentals(userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 50);
    const where = { user_id: userId };
    if (query.status) where.status = query.status;

    const { count, rows } = await Rental.findAndCountAll({
      where,
      include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'cover_image', 'genre'] }],
      order: [['created_at', 'DESC']],
      limit, offset: (page - 1) * limit
    });
    return { rentals: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async getAllRentals(query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 50);
    const where = {};
    if (query.status) where.status = query.status;

    const { count, rows } = await Rental.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'cover_image'] }
      ],
      order: [['created_at', 'DESC']],
      limit, offset: (page - 1) * limit
    });
    return { rentals: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async dispatchRental(rentalId, adminId) {
    const rental = await Rental.findByPk(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.status !== 'requested') throw new Error('Only requested rentals can be dispatched');

    await rental.update({ status: 'dispatched', dispatched_by: adminId, dispatched_at: new Date() });

    const book = await Book.findByPk(rental.book_id);
    if (book.available_copies > 0) await book.decrement('available_copies');

    User.findByPk(rental.user_id).then(user => {
      if (user) sendDispatchEmail(user, rental, book).catch(() => {});
    });

    return { rental, message: 'Book dispatched' };
  }

  async initiateReturn(rentalId, userId) {
    const rental = await Rental.findByPk(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.user_id !== userId) throw new Error('Unauthorized');
    if (rental.status !== 'dispatched') throw new Error('Only dispatched rentals can be returned');

    await rental.update({ status: 'return_initiated', return_date: new Date() });
    return { rental, message: 'Return initiated' };
  }

  async confirmReturn(rentalId, adminId) {
    const rental = await Rental.findByPk(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.status !== 'return_initiated') throw new Error('Return not initiated');

    await rental.update({ status: 'completed', received_by: adminId });

    const book = await Book.findByPk(rental.book_id);
    await book.increment('available_copies');
    await book.increment('rental_count');

    User.findByPk(rental.user_id).then(user => {
      if (user) sendReturnConfirmationEmail(user, rental, book).catch(() => {});
    });

    return { rental, message: 'Return confirmed' };
  }

  async cancelRental(rentalId, userId) {
    const rental = await Rental.findByPk(rentalId);
    if (!rental) throw new Error('Rental not found');
    if (rental.user_id !== userId) throw new Error('Unauthorized');
    if (rental.status !== 'requested') throw new Error('Only requested rentals can be cancelled');
    await rental.update({ status: 'cancelled' });
    return { rental, message: 'Rental cancelled' };
  }

  async getOverdueRentals() {
    const rentals = await Rental.findAll({
      where: { status: 'dispatched', due_date: { [Op.lt]: new Date() } },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Book, as: 'book', attributes: ['id', 'title'] }
      ]
    });
    for (const r of rentals) await r.update({ status: 'overdue' });
    return rentals;
  }

  async getRentalStats() {
    const total = await Rental.count();
    const active = await Rental.count({ where: { status: { [Op.in]: ['requested', 'dispatched', 'return_initiated'] } } });
    const completed = await Rental.count({ where: { status: 'completed' } });
    const overdue = await Rental.count({ where: { status: 'dispatched', due_date: { [Op.lt]: new Date() } } });
    return { totalRentals: total, activeRentals: active, completedRentals: completed, overdueRentals: overdue };
  }
}

module.exports = new RentalService();
