const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/messages
 * Send a new message
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo, metadata } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ error: 'chatId and content are required' });
    }

    // Verify membership
    const member = await query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [chatId, req.userId]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

    const result = await query(
      `INSERT INTO messages (chat_id, sender_id, content, type, reply_to, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, chat_id, sender_id, content, type, reply_to, metadata, created_at`,
      [chatId, req.userId, content, type, replyTo || null, JSON.stringify(metadata || {})]
    );

    const message = result.rows[0];

    // Create message status for all other members
    await query(
      `INSERT INTO message_status (message_id, user_id, status)
       SELECT $1, user_id, 'sent' FROM chat_members WHERE chat_id = $2 AND user_id != $3`,
      [message.id, chatId, req.userId]
    );

    // Update chat timestamp
    await query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);

    // Get sender info
    const sender = await query(
      'SELECT id, username, full_name, avatar_url FROM users WHERE id = $1',
      [req.userId]
    );

    res.status(201).json({
      id: message.id,
      chatId: message.chat_id,
      senderId: message.sender_id,
      sender: {
        id: sender.rows[0].id,
        username: sender.rows[0].username,
        fullName: sender.rows[0].full_name,
        avatarUrl: sender.rows[0].avatar_url,
      },
      content: message.content,
      type: message.type,
      replyTo: message.reply_to,
      metadata: message.metadata,
      createdAt: message.created_at,
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * PUT /api/messages/:id/react
 * Add/remove reaction to a message
 */
router.put('/:id/react', authenticate, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji required' });

    // Toggle reaction
    const existing = await query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [req.params.id, req.userId, emoji]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM message_reactions WHERE id = $1', [existing.rows[0].id]);
      res.json({ action: 'removed' });
    } else {
      await query(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [req.params.id, req.userId, emoji]
      );
      res.json({ action: 'added' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to react' });
  }
});

/**
 * DELETE /api/messages/:id
 * Soft delete a message
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `UPDATE messages SET is_deleted = true, content = NULL, updated_at = NOW()
       WHERE id = $1 AND sender_id = $2
       RETURNING id`,
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found or not authorized' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
