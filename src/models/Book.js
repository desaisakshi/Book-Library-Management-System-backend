const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  author_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  genre: { type: DataTypes.STRING(100), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  isbn: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  publication_date: { type: DataTypes.DATE, allowNull: true },
  cover_image: { type: DataTypes.STRING(500), allowNull: true },
  pdf_url: { type: DataTypes.STRING(500), allowNull: true },
  total_copies: { type: DataTypes.INTEGER, defaultValue: 0 },
  available_copies: { type: DataTypes.INTEGER, defaultValue: 0 },
  average_rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.00 },
  review_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  wishlist_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  read_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  rental_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'books', timestamps: true });

module.exports = Book;
