const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(255), unique: true, allowNull: true, validate: { isEmail: true } },
  mobile: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('user', 'author', 'admin'), defaultValue: 'user' },
  first_name: { type: DataTypes.STRING(100), allowNull: true },
  last_name: { type: DataTypes.STRING(100), allowNull: true },
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) user.password_hash = await bcrypt.hash(user.password_hash, 10);
    }
  }
});

User.prototype.comparePassword = async function (pwd) {
  return bcrypt.compare(pwd, this.password_hash);
};

User.prototype.toJSON = function () {
  const v = { ...this.get() };
  delete v.password_hash;
  return v;
};

module.exports = User;
