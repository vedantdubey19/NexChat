const express = require('express');
const { query, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/groups
 * Create a new group chat
 */
router.post('/', authenticate, async (req, res) => {
  const client = await getClient();
  try {
    const { name, description, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    await client.query('BEGIN');

    const chat = await client.query(
      "INSERT INTO chats (type, name, description, created_by) VALUES ('group', $1, $2, $3) RETURNING id",
      [name, description || '', req.userId]
    );

    const chatId = chat.rows[0].id;

    // Add creator as admin
    await client.query(
      "INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'admin')",
      [chatId, req.userId]
    );

    // Add members
    for (const memberId of memberIds) {
      if (memberId !== req.userId) {
        await client.query(
          "INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member')",
          [chatId, memberId]
        );
      }
    }

    // System message
    await client.query(
      "INSERT INTO messages (chat_id, sender_id, content, type) VALUES ($1, $2, $3, 'system')",
      [chatId, req.userId, `Group "${name}" created`]
    );

    await client.query('COMMIT');
    res.status(201).json({ chatId, name });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create group' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/groups/:id
 * Get group details with members
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chat = await query(
      `SELECT c.*, 
              (SELECT json_agg(json_build_object(
                'id', u.id, 'username', u.username, 'fullName', u.full_name,
                'avatarUrl', u.avatar_url, 'role', cm.role, 'isOnline', u.is_online
              )) FROM chat_members cm JOIN users u ON u.id = cm.user_id WHERE cm.chat_id = c.id) as members
       FROM chats c WHERE c.id = $1 AND c.type = 'group'`,
      [req.params.id]
    );

    if (chat.rows.length === 0) return res.status(404).json({ error: 'Group not found' });

    const g = chat.rows[0];
    res.json({
      id: g.id,
      name: g.name,
      description: g.description,
      avatarUrl: g.avatar_url,
      createdBy: g.created_by,
      members: g.members,
      createdAt: g.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

/**
 * PUT /api/groups/:id
 * Update group info
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, avatarUrl } = req.body;
    await query(
      'UPDATE chats SET name = COALESCE($1, name), description = COALESCE($2, description), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $4',
      [name, description, avatarUrl, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

/**
 * POST /api/groups/:id/members
 * Add members to group
 */
router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds?.length) return res.status(400).json({ error: 'userIds required' });

    for (const userId of userIds) {
      await query(
        "INSERT INTO chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
        [req.params.id, userId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add members' });
  }
});

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a member from group
 */
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM chat_members WHERE chat_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
