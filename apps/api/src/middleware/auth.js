const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { getDb } = require('../db');

function readToken(req) {
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.cinewave_token;
}

function currentUser(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = getDb()
      .prepare(
        `SELECT id, name, username, email, bio, avatar_color AS avatarColor,
                created_at AS createdAt
         FROM users WHERE id = ?`,
      )
      .get(payload.sub);
    if (user) req.user = user;
  } catch {
    // Un token caducado se trata como una sesión anónima.
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión para continuar.' },
    });
  }
  next();
}

module.exports = { currentUser, requireAuth };
