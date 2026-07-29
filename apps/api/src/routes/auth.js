const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { getDb } = require('../db');
const { config } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('../utils');

const router = express.Router();

const registrationSchema = z.object({
  name: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(60),
  username: z
    .string()
    .trim()
    .min(3, 'El usuario necesita al menos 3 caracteres.')
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, 'Usa solo letras, números y guion bajo.')
    .transform((value) => value.toLowerCase()),
  email: z.string().trim().email('El email no es válido.').toLowerCase(),
  password: z.string().min(8, 'La contraseña necesita al menos 8 caracteres.').max(72),
});

const loginSchema = z.object({
  identity: z.string().trim().min(1),
  password: z.string().min(1),
});

function issueSession(res, user) {
  const token = jwt.sign({ sub: String(user.id) }, config.jwtSecret, { expiresIn: '14d' });
  res.cookie('cinewave_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
  return token;
}

router.post('/register', async (req, res, next) => {
  try {
    const input = registrationSchema.parse(req.body);
    const db = getDb();
    const exists = db
      .prepare('SELECT id FROM users WHERE email = ? OR username = ?')
      .get(input.email, input.username);

    if (exists) {
      return res.status(409).json({
        error: { code: 'ACCOUNT_EXISTS', message: 'Ese email o usuario ya está registrado.' },
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const result = db
      .prepare(
        `INSERT INTO users (name, username, email, password_hash)
         VALUES (?, ?, ?, ?)`,
      )
      .run(input.name, input.username, input.email, passwordHash);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    issueSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = getDb()
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE OR username = ? COLLATE NOCASE')
      .get(input.identity, input.identity);
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos.' },
      });
    }
    issueSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('cinewave_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
  });
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
