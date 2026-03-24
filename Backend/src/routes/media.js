const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mp3|wav|ogg|pdf|doc|docx|xls|xlsx|zip/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

/**
 * POST /api/media/upload
 * Upload a file
 */
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { messageId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image') ? 'image'
      : req.file.mimetype.startsWith('video') ? 'video'
      : req.file.mimetype.startsWith('audio') ? 'audio'
      : 'file';

    const result = await query(
      `INSERT INTO media (message_id, uploader_id, url, type, filename, size_bytes, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, url, type, filename, size_bytes, mime_type`,
      [messageId || null, req.userId, fileUrl, fileType, req.file.originalname, req.file.size, req.file.mimetype]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * GET /api/media/:chatId
 * Get all media for a chat
 */
router.get('/:chatId', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT med.* FROM media med
       JOIN messages m ON m.id = med.message_id
       WHERE m.chat_id = $1
       ORDER BY med.created_at DESC
       LIMIT 100`,
      [req.params.chatId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

module.exports = router;
