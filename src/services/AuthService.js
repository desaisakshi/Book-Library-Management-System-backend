require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { User, Otp } = require('../models');
const { Op } = require('sequelize');
const {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateOTP, getOTPExpiration, isValidEmail, isValidMobile
} = require('../utils/authUtils');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');

class AuthService {
  async register(userData) {
    const { email, mobile, password, first_name, last_name } = userData;
    if (!password) throw new Error('Password is required');
    if (!email && !mobile) throw new Error('Email or mobile is required');

    if (email && await User.findOne({ where: { email } })) throw new Error('Email already registered');
    if (mobile && await User.findOne({ where: { mobile } })) throw new Error('Mobile already registered');

    const user = await User.create({ email, mobile, password_hash: password, first_name, last_name, role: 'user' });

    const otpCode = generateOTP();
    await Otp.create({
      user_id: user.id, otp_code: otpCode, purpose: 'registration',
      expires_at: getOTPExpiration(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10)
    });

    // Always log OTP in dev so you can test without email
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV] Registration OTP for ${email || mobile}: ${otpCode}\n`);
    }

    let emailSent = false;
    if (email) {
      try { await sendOTPEmail(user, otpCode); emailSent = true; }
      catch (e) { console.error('⚠️ OTP email failed:', e.message); }
    }

    return {
      user: user.toJSON(), userId: user.id, emailSent,
      message: emailSent
        ? 'Registration successful. Check your email for the OTP.'
        : 'Registration successful. Email failed — check server console for OTP.'
    };
  }

  async verifyOTP(userId, otpCode) {
    const otp = await Otp.findOne({
      where: { user_id: userId, otp_code: otpCode, is_used: false, expires_at: { [Op.gt]: new Date() } }
    });
    if (!otp) throw new Error('Invalid or expired OTP');

    await otp.update({ is_used: true });
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    await user.update({ is_verified: true });

    return { user: user.toJSON(), message: 'Account verified successfully' };
  }

  async login({ email, mobile, password }) {
    if (!email && !mobile) throw new Error('Email or mobile is required');
    if (!password) throw new Error('Password is required');

    const user = await User.findOne({ where: email ? { email } : { mobile } });
    if (!user) throw new Error('Invalid credentials');

    const valid = await user.comparePassword(password);
    if (!valid) throw new Error('Invalid credentials');

    if (!user.is_verified && user.role !== 'admin') {
      const otpCode = generateOTP();
      await Otp.create({
        user_id: user.id, otp_code: otpCode, purpose: 'login',
        expires_at: getOTPExpiration(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10)
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 [DEV] Login OTP for ${email || mobile}: ${otpCode}\n`);
      }
      let emailSent = false;
      if (user.email) {
        try { await sendOTPEmail(user, otpCode); emailSent = true; }
        catch (e) { console.error('⚠️ Login OTP email failed:', e.message); }
      }
      return {
        requiresVerification: true, userId: user.id, emailSent,
        message: emailSent ? 'OTP sent to your email.' : 'Email failed — check server console for OTP.'
      };
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    return { user: user.toJSON(), accessToken, refreshToken, message: 'Login successful' };
  }

  async requestPasswordReset(identifier) {
    const isEmail = isValidEmail(identifier);
    const user = await User.findOne({ where: isEmail ? { email: identifier } : { mobile: identifier } });
    if (!user) return { message: 'If account exists, OTP will be sent' };

    const otpCode = generateOTP();
    await Otp.create({
      user_id: user.id, otp_code: otpCode, purpose: 'password_reset',
      expires_at: getOTPExpiration(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10)
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV] Password reset OTP: ${otpCode}\n`);
    }
    if (user.email) {
      try { await sendPasswordResetEmail(user, otpCode); }
      catch (e) { console.error('⚠️ Password reset email failed:', e.message); }
    }
    return { userId: user.id, message: 'If account exists, OTP will be sent' };
  }

  async resetPassword(userId, otpCode, newPassword) {
    const otp = await Otp.findOne({
      where: { user_id: userId, otp_code: otpCode, purpose: 'password_reset', is_used: false, expires_at: { [Op.gt]: new Date() } }
    });
    if (!otp) throw new Error('Invalid or expired OTP');
    await otp.update({ is_used: true });
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    await user.update({ password_hash: newPassword });
    return { message: 'Password reset successful' };
  }

  async refreshToken(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findByPk(decoded.userId);
      if (!user) throw new Error('User not found');
      return { accessToken: generateAccessToken({ userId: user.id, role: user.role }) };
    } catch { throw new Error('Invalid refresh token'); }
  }

  async resendOTP(userId, purpose = 'registration') {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const otpCode = generateOTP();
    await Otp.create({
      user_id: user.id, otp_code: otpCode, purpose,
      expires_at: getOTPExpiration(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10)
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 [DEV] Resend OTP (${purpose}): ${otpCode}\n`);
    }
    let emailSent = false;
    if (user.email) {
      try {
        if (purpose === 'password_reset') await sendPasswordResetEmail(user, otpCode);
        else await sendOTPEmail(user, otpCode);
        emailSent = true;
      } catch (e) { console.error('⚠️ Resend OTP email failed:', e.message); }
    }
    return { emailSent, message: emailSent ? 'OTP sent' : 'Email failed — check server console for OTP.' };
  }
}

module.exports = new AuthService();
