const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/contacts
 * Get all contacts for the current user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.nickname, c.is_blocked, c.created_at,
              json_build_object(
                'id', u.id, 'username', u.username, 'fullName', u.full_name,
                'avatarUrl', u.avatar_url, 'bio', u.bio, 'isOnline', u.is_online, 'lastSeen', u.last_seen
              ) as user
       FROM contacts c
       JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = $1 AND c.is_blocked = false
       ORDER BY u.full_name ASC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * POST /api/contacts/sync
 * Add a contact
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    const { contactUserId } = req.body;
    if (!contactUserId) return res.status(400).json({ error: 'contactUserId required' });

    await query(
      'INSERT INTO contacts (user_id, contact_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, contactUserId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

/**
 * GET /api/contacts/search?q=term
 * Search contacts
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.is_online
       FROM contacts c
       JOIN users u ON u.id = c.contact_user_id
       WHERE c.user_id = $1 AND c.is_blocked = false
         AND (u.username ILIKE $2 OR u.full_name ILIKE $2)
       ORDER BY u.full_name ASC`,
      [req.userId, `%${q}%`]
    );

    res.json(result.rows.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      isOnline: u.is_online,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
