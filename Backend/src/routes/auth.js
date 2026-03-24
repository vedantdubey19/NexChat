const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, generateAccessToken, generateRefreshToken, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password, fullName } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    // Check if user already exists
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2 OR phone = $3',
      [username, email || null, phone || null]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists with this username, email, or phone' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      `INSERT INTO users (username, email, phone, password_hash, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, phone, full_name, avatar_url, bio, created_at`,
      [username, email || null, phone || null, passwordHash, fullName]
    );

    const user = result.rows[0];

    // Create default settings
    await query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    await query(
      'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refreshToken]
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/phone + password
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Find user by username, email, or phone
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1 OR phone = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update online status
    await query('UPDATE users SET is_online = true, last_seen = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store session
    await query(
      'INSERT INTO sessions (user_id, refresh_token, device_info, ip_address, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'30 days\')',
      [user.id, refreshToken, req.headers['user-agent'], req.ip]
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if session exists
    const session = await query(
      'SELECT * FROM sessions WHERE user_id = $1 AND refresh_token = $2 AND expires_at > NOW()',
      [decoded.userId, refreshToken]
    );

    if (session.rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    // Rotate refresh token
    await query('UPDATE sessions SET refresh_token = $1, expires_at = NOW() + INTERVAL \'30 days\' WHERE id = $2',
      [newRefreshToken, session.rows[0].id]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await query('DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2', [req.userId, refreshToken]);
    await query('UPDATE users SET is_online = false, last_seen = NOW() WHERE id = $1', [req.userId]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
