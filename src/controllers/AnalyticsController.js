const analyticsService = require('../services/AnalyticsService');
const ok = (res, data) => res.json({ success: true, data });
const err = (res, e) => res.status(400).json({ success: false, message: e.message });

class AnalyticsController {
  async getSystemOverview(req, res) { try { ok(res, await analyticsService.getSystemOverview()); } catch(e) { err(res, e); } }
  async getBookAnalytics(req, res) { try { ok(res, await analyticsService.getBookAnalytics(req.query.type)); } catch(e) { err(res, e); } }
  async getAuthorInsights(req, res) { try { ok(res, await analyticsService.getAuthorInsights()); } catch(e) { err(res, e); } }
  async getRentalAnalytics(req, res) { try { ok(res, await analyticsService.getRentalAnalytics()); } catch(e) { err(res, e); } }
  async getGenreDistribution(req, res) { try { ok(res, await analyticsService.getGenreDistribution()); } catch(e) { err(res, e); } }
  async getRecentActivity(req, res) { try { ok(res, await analyticsService.getRecentActivity()); } catch(e) { err(res, e); } }
  async getManuscriptAnalytics(req, res) { try { ok(res, await analyticsService.getManuscriptAnalytics()); } catch(e) { err(res, e); } }
}
module.exports = new AnalyticsController();
