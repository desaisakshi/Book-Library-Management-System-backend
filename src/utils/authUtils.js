const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) otp += Math.floor(Math.random() * 10);
  return otp;
};

const getOTPExpiration = (minutes = 10) =>
  new Date(Date.now() + minutes * 60 * 1000);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidMobile = (mobile) => /^[0-9]{10,15}$/.test((mobile || '').replace(/\D/g, ''));

const getPagination = (page = 1, limit = 10) => ({
  limit: Math.min(parseInt(limit, 10), 100),
  offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
});

module.exports = {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateOTP, getOTPExpiration, isValidEmail, isValidMobile, getPagination
};
