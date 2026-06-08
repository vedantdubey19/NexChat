const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chats
 * Get all chats for the current user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.type, c.name, c.avatar_url, c.created_at,
              cm.is_pinned, cm.is_muted, cm.last_read_at,
              (SELECT json_build_object(
                'id', m.id, 'content', m.content, 'type', m.type,
                'senderId', m.sender_id, 'createdAt', m.created_at
              ) FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT COUNT(*) FROM messages m 
               WHERE m.chat_id = c.id AND m.created_at > cm.last_read_at AND m.sender_id != $1
              ) as unread_count,
              CASE WHEN c.type = 'direct' THEN
                (SELECT json_build_object(
                  'id', u.id, 'username', u.username, 'fullName', u.full_name,
                  'avatarUrl', u.avatar_url, 'isOnline', u.is_online, 'lastSeen', u.last_seen
                ) FROM chat_members cm2 JOIN users u ON cm2.user_id = u.id 
                 WHERE cm2.chat_id = c.id AND cm2.user_id != $1 LIMIT 1)
              ELSE NULL END as other_user,
              CASE WHEN c.type = 'group' THEN
                (SELECT COUNT(*) FROM chat_members WHERE chat_id = c.id)
              ELSE NULL END as member_count
       FROM chats c
       JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $1
       ORDER BY cm.is_pinned DESC,
                (SELECT MAX(created_at) FROM messages WHERE chat_id = c.id) DESC NULLS LAST`,
      [req.userId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.type === 'group' ? row.name : row.other_user?.fullName,
      avatarUrl: row.type === 'group' ? row.avatar_url : row.other_user?.avatarUrl,
      isPinned: row.is_pinned,
      isMuted: row.is_muted,
      lastMessage: row.last_message,
      unreadCount: parseInt(row.unread_count),
      otherUser: row.other_user,
      memberCount: row.member_count ? parseInt(row.member_count) : undefined,
      createdAt: row.created_at,
    })));
  } catch (err) {
    console.error('Get chats error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

/**
 * POST /api/chats
 * Create a new direct chat or find existing one
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: 'userId required' });

    // Check if direct chat already exists
    const existing = await query(
      `SELECT c.id FROM chats c
       JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = $1
       JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = $2
       WHERE c.type = 'direct'`,
      [req.userId, otherUserId]
    );

    if (existing.rows.length > 0) {
      return res.json({ chatId: existing.rows[0].id, isNew: false });
    }

    // Create new chat
    const chat = await query(
      "INSERT INTO chats (type, created_by) VALUES ('direct', $1) RETURNING id",
      [req.userId]
    );

    const chatId = chat.rows[0].id;
    await query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, req.userId, otherUserId]);

    res.status(201).json({ chatId, isNew: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

/**
 * GET /api/chats/:id/messages
 * Get messages for a chat with pagination
 */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    // Verify membership
    const member = await query(
      'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (member.rows.length === 0) return res.status(403).json({ error: 'Not a member' });

    let messagesQuery = `
      SELECT m.id, m.content, m.type, m.sender_id, m.reply_to, m.is_edited,
             m.is_deleted, m.metadata, m.created_at,
             (SELECT COALESCE(MIN(status), 'sent') FROM message_status WHERE message_id = m.id) as status,
             json_build_object('id', u.id, 'username', u.username, 'fullName', u.full_name, 'avatarUrl', u.avatar_url) as sender,
             CASE WHEN m.reply_to IS NOT NULL THEN
               (SELECT json_build_object('id', rm.id, 'content', rm.content, 'senderId', rm.sender_id)
                FROM messages rm WHERE rm.id = m.reply_to)
             ELSE NULL END as replied_message,
             (SELECT json_agg(json_build_object('emoji', mr.emoji, 'userId', mr.user_id))
              FROM message_reactions mr WHERE mr.message_id = m.id) as reactions
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.chat_id = $1`;

    const params = [id];
    if (before) {
      messagesQuery += ` AND m.created_at < $2`;
      params.push(before);
    }
    messagesQuery += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await query(messagesQuery, params);

    // Update last_read_at
    await query('UPDATE chat_members SET last_read_at = NOW() WHERE chat_id = $1 AND user_id = $2',
      [id, req.userId]);

    res.json(result.rows.reverse().map(m => ({
      id: m.id,
      content: m.is_deleted ? null : m.content,
      type: m.type,
      senderId: m.sender_id,
      sender: m.sender,
      replyTo: m.replied_message,
      isEdited: m.is_edited,
      isDeleted: m.is_deleted,
      metadata: m.metadata,
      reactions: m.reactions || [],
      status: m.status,
      createdAt: m.created_at,
    })));
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * PUT /api/chats/:id/pin
 */
router.put('/:id/pin', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    const { isPinned } = req.body;
    await query('UPDATE chat_members SET is_pinned = $1 WHERE chat_id = $2 AND user_id = $3',
      [isPinned, id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pin' });
  }
});

/**
 * PUT /api/chats/:id/mute
 */
router.put('/:id/mute', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    const { isMuted } = req.body;
    await query('UPDATE chat_members SET is_muted = $1 WHERE chat_id = $2 AND user_id = $3',
      [isMuted, id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mute' });
  }
});

module.exports = router;
