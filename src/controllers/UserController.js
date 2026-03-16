const userService = require('../services/UserService');
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const err = (res, e) => res.status(400).json({ success: false, message: e.message });

class UserController {
  async getProfile(req, res) { try { ok(res, await userService.getProfile(req.user.id)); } catch(e) { err(res, e); } }
  async updateProfile(req, res) { try { ok(res, await userService.updateProfile(req.user.id, req.body)); } catch(e) { err(res, e); } }
  async requestAuthorUpgrade(req, res) { try { ok(res, await userService.requestAuthorUpgrade(req.user.id, req.body), 201); } catch(e) { err(res, e); } }
  async getDashboard(req, res) { try { ok(res, await userService.getDashboard(req.user.id)); } catch(e) { err(res, e); } }
  async getAllUsers(req, res) { try { ok(res, await userService.getAllUsers(req.query)); } catch(e) { err(res, e); } }
  async deleteUser(req, res) { try { ok(res, await userService.deleteUser(req.params.id)); } catch(e) { err(res, e); } }
}
module.exports = new UserController();
