const { sequelize } = require('../config/database');
const User = require('./User');
const Author = require('./Author');
const Book = require('./Book');
const Manuscript = require('./Manuscript');
const Rental = require('./Rental');
const Review = require('./Review');
const Wishlist = require('./Wishlist');
const Otp = require('./Otp');

// User ↔ Author
User.hasOne(Author, { foreignKey: 'user_id', as: 'authorProfile' });
Author.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Author approval by admin
User.hasMany(Author, { foreignKey: 'approved_by', as: 'approvedAuthors' });
Author.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Author ↔ Books
Author.hasMany(Book, { foreignKey: 'author_id', as: 'books' });
Book.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });

// Author ↔ Manuscripts
Author.hasMany(Manuscript, { foreignKey: 'author_id', as: 'manuscripts' });
Manuscript.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });

// Manuscript reviewed by admin
User.hasMany(Manuscript, { foreignKey: 'reviewed_by', as: 'reviewedManuscripts' });
Manuscript.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// User ↔ Rentals
User.hasMany(Rental, { foreignKey: 'user_id', as: 'rentals' });
Rental.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Book.hasMany(Rental, { foreignKey: 'book_id', as: 'rentals' });
Rental.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// Rental dispatched/received by admin
User.hasMany(Rental, { foreignKey: 'dispatched_by', as: 'dispatchedRentals' });
Rental.belongsTo(User, { foreignKey: 'dispatched_by', as: 'dispatcher' });
User.hasMany(Rental, { foreignKey: 'received_by', as: 'receivedRentals' });
Rental.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });

// User ↔ Reviews
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Book.hasMany(Review, { foreignKey: 'book_id', as: 'reviews' });
Review.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// User ↔ Wishlist
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlists' });
Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Book.hasMany(Wishlist, { foreignKey: 'book_id', as: 'wishlists' });
Wishlist.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// User ↔ OTPs
User.hasMany(Otp, { foreignKey: 'user_id', as: 'otps' });
Otp.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Author, Book, Manuscript, Rental, Review, Wishlist, Otp };
