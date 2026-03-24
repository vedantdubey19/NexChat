const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/calls/initiate
 * Initiate a call
 */
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { calleeId, chatId, type = 'voice' } = req.body;
    if (!calleeId) return res.status(400).json({ error: 'calleeId required' });

    const result = await query(
      `INSERT INTO calls (caller_id, callee_id, chat_id, type, status, started_at)
       VALUES ($1, $2, $3, $4, 'initiated', NOW())
       RETURNING *`,
      [req.userId, calleeId, chatId || null, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

/**
 * GET /api/calls/history
 * Get call history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
              CASE WHEN c.caller_id = $1 THEN
                json_build_object('id', u2.id, 'username', u2.username, 'fullName', u2.full_name, 'avatarUrl', u2.avatar_url)
              ELSE
                json_build_object('id', u1.id, 'username', u1.username, 'fullName', u1.full_name, 'avatarUrl', u1.avatar_url)
              END as other_user,
              CASE WHEN c.caller_id = $1 THEN 'outgoing' ELSE 'incoming' END as direction
       FROM calls c
       JOIN users u1 ON u1.id = c.caller_id
       JOIN users u2 ON u2.id = c.callee_id
       WHERE c.caller_id = $1 OR c.callee_id = $1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

module.exports = router;
