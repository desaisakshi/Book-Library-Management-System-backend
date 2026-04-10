const authorService = require('../services/AuthorService');
const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const err = (res, e, code = 400) => res.status(code).json({ success: false, message: e.message });

class AuthorController {
  async getAllAuthors(req, res) { try { ok(res, await authorService.getAllAuthors(req.query)); } catch(e) { err(res, e); } }
  async createAuthor(req, res) { try { ok(res, await authorService.createAuthor(req.body), 201); } catch(e) { err(res, e); } }
  async updateAuthor(req, res) { try { ok(res, await authorService.updateAuthor(req.params.id, req.body)); } catch(e) { err(res, e); } }
  async deleteAuthor(req, res) { try { ok(res, await authorService.deleteAuthor(req.params.id)); } catch(e) { err(res, e); } }
  async getAuthorProfile(req, res) { try { ok(res, await authorService.getAuthorProfile(req.params.id)); } catch(e) { err(res, e, 404); } }
  async getAuthorBooks(req, res) { try { ok(res, await authorService.getAuthorBooks(req.params.id, req.query)); } catch(e) { err(res, e); } }
  async getAuthorManuscripts(req, res) { try { ok(res, await authorService.getAuthorManuscripts(req.params.id, req.query)); } catch(e) { err(res, e); } }
  async submitManuscript(req, res) {
    // FIX: authorProfile is populated by auth middleware for author users
    const authorProfile = req.user.authorProfile;
    if (!authorProfile) return err(res, new Error('Author profile not found'), 403);
    try { ok(res, await authorService.submitManuscript(authorProfile.id, req.body), 201); } catch(e) { err(res, e); }
  }
  async getAuthorMetrics(req, res) { try { ok(res, await authorService.getAuthorMetrics(req.params.id)); } catch(e) { err(res, e); } }
  async getPendingRequests(req, res) { try { ok(res, await authorService.getPendingRequests(req.query)); } catch(e) { err(res, e); } }
  async approveAuthor(req, res) {
    const { approved } = req.body;
    if (approved === undefined) return err(res, new Error('approved required'));
    try { ok(res, await authorService.approveAuthor(req.params.id, approved, req.user.id)); } catch(e) { err(res, e); }
  }
}
module.exports = new AuthorController();
