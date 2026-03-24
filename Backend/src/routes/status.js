const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/status
 * Create a new status/story
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { type = 'text', content, mediaUrl, backgroundColor, fontStyle } = req.body;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const result = await query(
      `INSERT INTO statuses (user_id, type, content, media_url, background_color, font_style, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, type, content, mediaUrl, backgroundColor, fontStyle, expiresAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create status' });
  }
});

/**
 * GET /api/status/feed
 * Get status feed from contacts
 */
router.get('/feed', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, 
              json_build_object('id', u.id, 'username', u.username, 'fullName', u.full_name, 'avatarUrl', u.avatar_url) as user,
              (SELECT COUNT(*) FROM status_viewers sv WHERE sv.status_id = s.id) as view_count,
              EXISTS(SELECT 1 FROM status_viewers sv WHERE sv.status_id = s.id AND sv.viewer_id = $1) as is_viewed
       FROM statuses s
       JOIN users u ON u.id = s.user_id
       WHERE s.expires_at > NOW()
         AND (s.user_id = $1 OR s.user_id IN (SELECT contact_user_id FROM contacts WHERE user_id = $1))
       ORDER BY s.user_id = $1 DESC, s.created_at DESC`,
      [req.userId]
    );

    // Group by user
    const grouped = {};
    for (const status of result.rows) {
      const userId = status.user_id;
      if (!grouped[userId]) {
        grouped[userId] = { user: status.user, statuses: [], allViewed: true };
      }
      grouped[userId].statuses.push(status);
      if (!status.is_viewed && userId !== req.userId) grouped[userId].allViewed = false;
    }

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status feed' });
  }
});

/**
 * GET /api/status/:id/viewers
 * Get viewers of a status
 */
router.get('/:id/viewers', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, sv.viewed_at
       FROM status_viewers sv
       JOIN users u ON u.id = sv.viewer_id
       WHERE sv.status_id = $1
       ORDER BY sv.viewed_at DESC`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch viewers' });
  }
});

module.exports = router;
