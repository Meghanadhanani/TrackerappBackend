const pool = require('../config/db');

const noteController = {
  getNotes: async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.userId]
      );
      res.json({ success: true, notes: result.rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch notes' });
    }
  },

  createNote: async (req, res) => {
    const { title, lectures, totalLectures, subject } = req.body;
    
    try {
      const result = await pool.query(
        'INSERT INTO notes (title, lectures, total_lectures, subject, user_id, completed_lectures) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [title, lectures, totalLectures, subject, req.user.userId, []]
      );
      res.status(201).json({ success: true, note: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create note' });
    }
  },

  updateNote: async (req, res) => {
    const { id } = req.params;
    const { title, lectures, totalLectures, subject } = req.body;

    try {
      const result = await pool.query(
        'UPDATE notes SET title = $1, lectures = $2, total_lectures = $3, subject = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
        [title, lectures, totalLectures, subject, id, req.user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      
      res.json({ success: true, note: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update note' });
    }
  },

  deleteNote: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, req.user.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }
      
      res.json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
  },

  toggleLecture: async (req, res) => {
    const { id } = req.params;
    const { lectureIndex } = req.body;

    try {
      const noteResult = await pool.query(
        'SELECT completed_lectures FROM notes WHERE id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (noteResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Note not found' });
      }

      const completedLectures = noteResult.rows[0].completed_lectures;
      const updatedLectures = completedLectures.includes(lectureIndex)
        ? completedLectures.filter(idx => idx !== lectureIndex)
        : [...completedLectures, lectureIndex];

      const result = await pool.query(
        'UPDATE notes SET completed_lectures = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [updatedLectures, id, req.user.userId]
      );

      res.json({ success: true, note: result.rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to toggle lecture' });
    }
  }
};

module.exports = noteController;
