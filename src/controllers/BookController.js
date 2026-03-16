const bookService = require('../services/BookService');

class BookController {
  async createBook(req, res) {
    try {
      // FIX: for authors use authorProfile.id which is now populated by middleware
      const authorId = req.user.role === 'author' ? req.user.authorProfile?.id : req.body.author_id;
      if (!authorId) return res.status(400).json({ success: false, message: 'Author ID required' });
      res.status(201).json({ success: true, data: await bookService.createBook(authorId, req.body) });
    } catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async getAllBooks(req, res) {
    try { res.json({ success: true, data: await bookService.getAllBooks(req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async getBookById(req, res) {
    try { res.json({ success: true, data: await bookService.getBookById(req.params.id) }); }
    catch (e) { res.status(404).json({ success: false, message: e.message }); }
  }
  async updateBook(req, res) {
    try { res.json({ success: true, data: await bookService.updateBook(req.params.id, req.body) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async deleteBook(req, res) {
    try { res.json({ success: true, data: await bookService.deleteBook(req.params.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async getGenres(req, res) {
    try { res.json({ success: true, data: await bookService.getGenres() }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async readBook(req, res) {
    try { res.json({ success: true, data: await bookService.readBook(req.params.id, req.user.id) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async getPopularBooks(req, res) {
    try { res.json({ success: true, data: await bookService.getPopularBooks(req.params.type, req.query.limit || 10) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
  async getBookReviews(req, res) {
    try { res.json({ success: true, data: await bookService.getBookReviews(req.params.id, req.query) }); }
    catch (e) { res.status(400).json({ success: false, message: e.message }); }
  }
}
module.exports = new BookController();
