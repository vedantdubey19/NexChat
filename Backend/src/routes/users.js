const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.phone, u.full_name, u.avatar_url, u.bio,
              u.is_online, u.last_seen, u.created_at,
              (SELECT COUNT(*) FROM contacts WHERE user_id = u.id) as contact_count,
              (SELECT COUNT(*) FROM chat_members cm JOIN chats c ON cm.chat_id = c.id WHERE cm.user_id = u.id AND c.type = 'group') as group_count
       FROM users u WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      isOnline: user.is_online,
      lastSeen: user.last_seen,
      contactCount: parseInt(user.contact_count),
      groupCount: parseInt(user.group_count),
      createdAt: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, username, bio, avatarUrl } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) { updates.push(`full_name = $${paramCount++}`); values.push(fullName); }
    if (username !== undefined) { updates.push(`username = $${paramCount++}`); values.push(username); }
    if (bio !== undefined) { updates.push(`bio = $${paramCount++}`); values.push(bio); }
    if (avatarUrl !== undefined) { updates.push(`avatar_url = $${paramCount++}`); values.push(avatarUrl); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, username, email, phone, full_name, avatar_url, bio`,
      values
    );

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/users/search?q=term
 * Search users by username or full name
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const result = await query(
      `SELECT id, username, full_name, avatar_url, bio, is_online
       FROM users
       WHERE id != $1 AND (username ILIKE $2 OR full_name ILIKE $2)
       LIMIT 20`,
      [req.userId, `%${q}%`]
    );

    res.json(result.rows.map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      isOnline: u.is_online,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
