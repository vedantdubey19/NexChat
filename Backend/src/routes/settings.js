const express = require('express');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) {
      // Create default settings
      await query('INSERT INTO user_settings (user_id) VALUES ($1)', [req.userId]);
      const newResult = await query('SELECT * FROM user_settings WHERE user_id = $1', [req.userId]);
      return res.json(newResult.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/', authenticate, async (req, res) => {
  try {
    const { theme, language, fontSize, mediaAutoDownload } = req.body;
    await query(
      `UPDATE user_settings SET
        theme = COALESCE($1, theme),
        language = COALESCE($2, language),
        font_size = COALESCE($3, font_size),
        media_auto_download = COALESCE($4, media_auto_download),
        updated_at = NOW()
       WHERE user_id = $5`,
      [theme, language, fontSize, mediaAutoDownload, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * PUT /api/settings/privacy
 * Update privacy settings
 */
router.put('/privacy', authenticate, async (req, res) => {
  try {
    const { lastSeenVisibility, profilePhotoVisibility, readReceipts, typingIndicators } = req.body;
    await query(
      `UPDATE user_settings SET
        last_seen_visibility = COALESCE($1, last_seen_visibility),
        profile_photo_visibility = COALESCE($2, profile_photo_visibility),
        read_receipts = COALESCE($3, read_receipts),
        typing_indicators = COALESCE($4, typing_indicators),
        updated_at = NOW()
       WHERE user_id = $5`,
      [lastSeenVisibility, profilePhotoVisibility, readReceipts, typingIndicators, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/**
 * PUT /api/settings/notifications
 * Update notification settings
 */
router.put('/notifications', authenticate, async (req, res) => {
  try {
    const { notificationMessages, notificationGroups, notificationCalls } = req.body;
    await query(
      `UPDATE user_settings SET
        notification_messages = COALESCE($1, notification_messages),
        notification_groups = COALESCE($2, notification_groups),
        notification_calls = COALESCE($3, notification_calls),
        updated_at = NOW()
       WHERE user_id = $4`,
      [notificationMessages, notificationGroups, notificationCalls, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

module.exports = router;
