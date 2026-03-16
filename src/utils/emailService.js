const nodemailer = require('nodemailer');

/**
 * Create Gmail SMTP transporter
 * FIX: parseInt port, strip spaces from App Password, add TLS options
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,  // FIX: must be integer
    secure: false,   // false = STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      // FIX: remove spaces — Gmail App Passwords are shown with spaces but used without
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
    },
    tls: { rejectUnauthorized: false }
  });
};

/**
 * Core send function — returns { success, error? }
 * FIX: never throws, always returns result object
 */
const sendEmail = async (to, subject, html) => {
  // Dev bypass: if credentials are missing/placeholder, log to console
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    console.log(`\n📧 [DEV - no SMTP] Email to: ${to}`);
    console.log(`   Subject: ${subject}`);
    const otpMatch = html.match(/(\d{6})/);
    if (otpMatch) console.log(`   🔑 OTP CODE: ${otpMatch[1]}`);
    console.log('');
    return { success: true };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Library" <${process.env.SMTP_USER}>`,
      to, subject, html
    });
    console.log(`✅ Email sent to ${to} [${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email FAILED to ${to}: ${err.message}`);
    if (err.code === 'EAUTH') {
      console.error('   → Check SMTP_USER and SMTP_PASS in .env');
      console.error('   → Gmail: use App Password (16 chars, no spaces)');
    }
    return { success: false, error: err.message };
  }
};

const sendOTPEmail = async (user, otp) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">📚 Library System</h1>
      </div>
      <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
        <h2 style="color:#1f2937;margin-top:0">Verify Your Account</h2>
        <p style="color:#374151">Hello <strong>${user.first_name || 'User'}</strong>,</p>
        <p style="color:#374151">Your verification code is:</p>
        <div style="background:#fff;border:2px solid #4f46e5;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#4f46e5">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">⏱ Expires in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.</p>
        <p style="color:#6b7280;font-size:13px">If you didn't register, ignore this email.</p>
      </div>
    </div>`;
  const result = await sendEmail(user.email, 'Verify Your Account - Library System', html);
  if (!result.success) throw new Error(`OTP email failed: ${result.error}`);
  return result;
};

const sendPasswordResetEmail = async (user, otp) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="background:#dc2626;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0">🔐 Password Reset</h1>
      </div>
      <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
        <p style="color:#374151">Hello <strong>${user.first_name || 'User'}</strong>,</p>
        <p>Your password reset code:</p>
        <div style="background:#fff;border:2px solid #dc2626;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#dc2626">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px">⏱ Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
      </div>
    </div>`;
  const result = await sendEmail(user.email, 'Password Reset - Library System', html);
  if (!result.success) throw new Error(`Password reset email failed: ${result.error}`);
  return result;
};

const sendRentalConfirmationEmail = async (user, rental, book) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <h2 style="color:#059669">✅ Rental Confirmed!</h2>
      <p>Hello <strong>${user.first_name || 'User'}</strong>,</p>
      <p>Your rental for <strong>${book.title}</strong> is confirmed.</p>
      <p><strong>Due Date:</strong> ${new Date(rental.due_date).toLocaleDateString()}</p>
    </div>`;
  return sendEmail(user.email, 'Rental Confirmed - Library System', html);
};

const sendDispatchEmail = async (user, rental, book) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <h2 style="color:#2563eb">📦 Book Dispatched!</h2>
      <p>Hello <strong>${user.first_name || 'User'}</strong>,</p>
      <p><strong>${book.title}</strong> has been dispatched to you.</p>
      <p><strong>Due Date:</strong> ${new Date(rental.due_date).toLocaleDateString()}</p>
    </div>`;
  return sendEmail(user.email, 'Book Dispatched - Library System', html);
};

const sendReturnConfirmationEmail = async (user, rental, book) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <h2 style="color:#059669">✅ Return Confirmed!</h2>
      <p>Hello <strong>${user.first_name || 'User'}</strong>,</p>
      <p>We've received <strong>${book.title}</strong>. Thank you!</p>
    </div>`;
  return sendEmail(user.email, 'Return Confirmed - Library System', html);
};

const sendReturnReminderEmail = async (user, rental, book) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <h2 style="color:#d97706">⚠️ Return Reminder</h2>
      <p>Hello <strong>${user.first_name || 'User'}</strong>,</p>
      <p><strong>${book.title}</strong> is due on ${new Date(rental.due_date).toLocaleDateString()}. Please return it.</p>
    </div>`;
  return sendEmail(user.email, 'Return Reminder - Library System', html);
};

module.exports = {
  sendEmail, sendOTPEmail, sendPasswordResetEmail,
  sendRentalConfirmationEmail, sendDispatchEmail,
  sendReturnConfirmationEmail, sendReturnReminderEmail
};
