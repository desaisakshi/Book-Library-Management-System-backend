const authService = require('../services/AuthService');

class AuthController {
  async register(req, res) {
    try { res.status(201).json({ success: true, data: await authService.register(req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async verifyOTP(req, res) {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ success: false, message: 'userId and otp required' });
    try { res.json({ success: true, data: await authService.verifyOTP(userId, otp) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (e) { res.status(401).json({ success: false, message: e.message }); }
  }
  async forgotPassword(req, res) {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ success: false, message: 'Email or mobile required' });
    try { res.json({ success: true, data: await authService.requestPasswordReset(identifier) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async resetPassword(req, res) {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) return res.status(400).json({ success: false, message: 'userId, otp, newPassword required' });
    try { res.json({ success: true, data: await authService.resetPassword(userId, otp, newPassword) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async refreshToken(req, res) {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'refreshToken required' });
    try { res.json({ success: true, data: await authService.refreshToken(refreshToken) }); }
    catch (e) { res.status(401).json({ success: false, message: e.message }); }
  }
  async resendOTP(req, res) {
    const { userId, purpose } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    try { res.json({ success: true, data: await authService.resendOTP(userId, purpose || 'registration') }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
}
module.exports = new AuthController();
