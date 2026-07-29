const express = require('express');
const { z } = require('zod');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parseSnapshot, publicUser } = require('../utils');

const router = express.Router();

router.get('/me/dashboard', requireAuth, (req, res) => {
  const db = getDb();
  const stats = {
    favorites: db
      .prepare("SELECT COUNT(*) AS count FROM list_items WHERE user_id = ? AND list_type = 'favorite'")
      .get(req.user.id).count,
    watchlist: db
      .prepare("SELECT COUNT(*) AS count FROM list_items WHERE user_id = ? AND list_type = 'watchlist'")
      .get(req.user.id).count,
    ratings: db.prepare('SELECT COUNT(*) AS count FROM ratings WHERE user_id = ?').get(req.user.id)
      .count,
    reviews: db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE user_id = ?').get(req.user.id)
      .count,
  };

  const activity = db
    .prepare(
      `SELECT 'rating' AS type, movie_snapshot, score AS value,
              updated_at AS createdAt
       FROM ratings WHERE user_id = ?
       UNION ALL
       SELECT list_type AS type, movie_snapshot, NULL AS value,
              created_at AS createdAt
       FROM list_items WHERE user_id = ?
       UNION ALL
       SELECT 'review' AS type, movie_snapshot, title AS value,
              created_at AS createdAt
       FROM reviews WHERE user_id = ?
       ORDER BY createdAt DESC LIMIT 12`,
    )
    .all(req.user.id, req.user.id, req.user.id)
    .map(parseSnapshot)
    .map(({ movie_snapshot, ...row }) => row);

  res.json({ stats, activity });
});

router.get('/me/ratings', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT id, movie_id AS movieId, score, movie_snapshot,
              created_at AS createdAt, updated_at AS updatedAt
       FROM ratings WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(req.user.id)
    .map(parseSnapshot)
    .map(({ movie_snapshot, ...row }) => row);
  res.json({ ratings: rows });
});

router.patch('/me', requireAuth, (req, res, next) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(60).optional(),
        username: z
          .string()
          .trim()
          .min(3)
          .max(24)
          .regex(/^[a-zA-Z0-9_]+$/)
          .transform((value) => value.toLowerCase())
          .optional(),
        bio: z.string().trim().max(280).optional(),
        avatarColor: z
          .enum(['#2176ff', '#7657ff', '#00a6a6', '#ef476f', '#f59e0b', '#10b981'])
          .optional(),
      })
      .parse(req.body);

    const fields = [];
    const values = [];
    const fieldMap = { name: 'name', username: 'username', bio: 'bio', avatarColor: 'avatar_color' };
    Object.entries(input).forEach(([key, value]) => {
      fields.push(`${fieldMap[key]} = ?`);
      values.push(value);
    });
    if (!fields.length) return res.json({ user: req.user });

    try {
      getDb()
        .prepare(
          `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .run(...values, req.user.id);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          error: { code: 'USERNAME_EXISTS', message: 'Ese nombre de usuario ya está ocupado.' },
        });
      }
      throw error;
    }
    const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/:username', (req, res) => {
  const user = getDb()
    .prepare(
      `SELECT id, name, username, bio, avatar_color AS avatarColor,
              created_at AS createdAt
       FROM users WHERE username = ? COLLATE NOCASE`,
    )
    .get(req.params.username);
  if (!user) {
    return res.status(404).json({
      error: { code: 'USER_NOT_FOUND', message: 'No se ha encontrado el perfil.' },
    });
  }
  const stats = getDb()
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM list_items WHERE user_id = @id AND list_type = 'favorite') AS favorites,
        (SELECT COUNT(*) FROM ratings WHERE user_id = @id) AS ratings,
        (SELECT COUNT(*) FROM reviews WHERE user_id = @id) AS reviews`,
    )
    .get({ id: user.id });
  res.json({ user, stats });
});

module.exports = router;
