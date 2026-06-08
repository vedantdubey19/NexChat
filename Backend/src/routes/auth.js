const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, generateAccessToken, generateRefreshToken, JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');

const router = express.Router();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendEmailOtp = async (email, username, otp) => {
  if (!resend) {
    console.warn('Resend client not initialized (RESEND_API_KEY missing)');
    return;
  }
  try {
    await resend.emails.send({
      from: 'NexChat <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your NexChat Account',
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 480px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #00a884; margin-top: 0;">Welcome to NexChat, ${username}!</h2>
          <p style="color: #475569; font-size: 0.95rem; line-height: 1.5;">To complete your registration, please verify your email address using the one-time password below:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; font-size: 1.8rem; font-weight: 700; color: #0f172a; letter-spacing: 6px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0;">This OTP code is valid for 10 minutes. If you did not request this code, you can safely ignore this email.</p>
        </div>
      `
    });
    console.log(`✉️ OTP email sent successfully to ${email}`);
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${email}:`, err);
  }
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

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

    // Initial verification status: false if provided, true if not provided
    const emailVerified = !email;
    const phoneVerified = !phone;

    // Create user
    const result = await query(
      `INSERT INTO users (username, email, phone, password_hash, full_name, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, phone, full_name, avatar_url, bio, created_at`,
      [username, email || null, phone || null, passwordHash, fullName, emailVerified, phoneVerified]
    );

    const user = result.rows[0];

    // Create default settings
    await query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);

    // Generate OTP codes
    const emailOtp = email ? generateOtp() : null;
    const phoneOtp = phone ? generateOtp() : null;

    if (emailOtp || phoneOtp) {
      await query(
        `INSERT INTO user_otps (user_id, email_otp, phone_otp, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
        [user.id, emailOtp, phoneOtp]
      );
      
      console.log(`🔑 Verification OTPs for user ${user.username}:`);
      if (emailOtp) {
        console.log(`  - Email OTP [${user.email}]: ${emailOtp}`);
        await sendEmailOtp(user.email, user.username, emailOtp);
      }
      if (phoneOtp) console.log(`  - Phone OTP [${user.phone}]: ${phoneOtp}`);
    }

    res.status(201).json({
      message: 'OTP verification required',
      verificationRequired: true,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      emailOtp,
      phoneOtp
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

    // Check if email and phone are verified
    const needsEmailVerification = user.email && !user.email_verified;
    const needsPhoneVerification = user.phone && !user.phone_verified;

    if (needsEmailVerification || needsPhoneVerification) {
      // Generate and resend new OTPs
      const emailOtp = needsEmailVerification ? generateOtp() : null;
      const phoneOtp = needsPhoneVerification ? generateOtp() : null;

      await query(
        `INSERT INTO user_otps (user_id, email_otp, phone_otp, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')
         ON CONFLICT (user_id) DO UPDATE SET
           email_otp = EXCLUDED.email_otp,
           phone_otp = EXCLUDED.phone_otp,
           expires_at = EXCLUDED.expires_at`,
        [user.id, emailOtp, phoneOtp]
      );

      console.log(`🔑 Verification OTPs for unverified user logging in ${user.username}:`);
      if (emailOtp) {
        console.log(`  - Email OTP [${user.email}]: ${emailOtp}`);
        await sendEmailOtp(user.email, user.username, emailOtp);
      }
      if (phoneOtp) console.log(`  - Phone OTP [${user.phone}]: ${phoneOtp}`);

      return res.json({
        error: 'Account not verified. Verification code has been sent.',
        verificationRequired: true,
        userId: user.id,
        email: user.email,
        phone: user.phone,
        emailOtp,
        phoneOtp
      });
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
 * POST /api/auth/verify-otp
 * Verify OTP for new user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, emailOtp, phoneOtp } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch user
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    // Fetch OTP record
    const otpResult = await query(
      'SELECT * FROM user_otps WHERE user_id = $1 AND expires_at > NOW()',
      [userId]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    const otps = otpResult.rows[0];

    // Verify OTPs
    if (user.email && !user.email_verified) {
      if (otps.email_otp !== emailOtp) {
        return res.status(400).json({ error: 'Invalid email verification code' });
      }
    }

    if (user.phone && !user.phone_verified) {
      if (otps.phone_otp !== phoneOtp) {
        return res.status(400).json({ error: 'Invalid phone verification code' });
      }
    }

    // Update user status to verified
    await query(
      'UPDATE users SET email_verified = true, phone_verified = true, is_online = true, last_seen = NOW() WHERE id = $1',
      [userId]
    );

    // Delete OTP record
    await query('DELETE FROM user_otps WHERE user_id = $1', [userId]);

    // Create default settings if not exists
    await query(
      'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [userId]
    );

    // Generate tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Store session
    await query(
      'INSERT INTO sessions (user_id, refresh_token, device_info, ip_address, expires_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'30 days\')',
      [userId, refreshToken, req.headers['user-agent'], req.ip]
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
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const emailOtp = user.email && !user.email_verified ? generateOtp() : null;
    const phoneOtp = user.phone && !user.phone_verified ? generateOtp() : null;

    if (emailOtp || phoneOtp) {
      // Upsert OTP
      await query(
        `INSERT INTO user_otps (user_id, email_otp, phone_otp, expires_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')
         ON CONFLICT (user_id) DO UPDATE SET
           email_otp = EXCLUDED.email_otp,
           phone_otp = EXCLUDED.phone_otp,
           expires_at = EXCLUDED.expires_at`,
        [userId, emailOtp, phoneOtp]
      );

      console.log(`🔑 Resent OTPs for user ${user.username}:`);
      if (emailOtp) {
        console.log(`  - Email OTP [${user.email}]: ${emailOtp}`);
        await sendEmailOtp(user.email, user.username, emailOtp);
      }
      if (phoneOtp) console.log(`  - Phone OTP [${user.phone}]: ${phoneOtp}`);
    }

    res.json({
      message: 'OTPs resent successfully',
      emailOtp,
      phoneOtp
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
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
