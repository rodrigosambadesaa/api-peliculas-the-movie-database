const express = require('express');
const { z } = require('zod');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { movieSnapshot, parseSnapshot } = require('../utils');

const router = express.Router();
router.use(requireAuth);

const typeSchema = z.enum(['favorite', 'watchlist']);
const movieSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(200),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().max(20).optional(),
  vote_average: z.coerce.number().min(0).max(10).optional(),
});

router.get('/', (req, res, next) => {
  try {
    const type = req.query.type ? typeSchema.parse(req.query.type) : undefined;
    const rows = type
      ? getDb()
          .prepare(
            `SELECT id, movie_id AS movieId, list_type AS listType,
                    movie_snapshot, created_at AS createdAt
             FROM list_items WHERE user_id = ? AND list_type = ?
             ORDER BY created_at DESC`,
          )
          .all(req.user.id, type)
      : getDb()
          .prepare(
            `SELECT id, movie_id AS movieId, list_type AS listType,
                    movie_snapshot, created_at AS createdAt
             FROM list_items WHERE user_id = ? ORDER BY created_at DESC`,
          )
          .all(req.user.id);
    res.json({ items: rows.map(parseSnapshot).map(({ movie_snapshot, ...row }) => row) });
  } catch (error) {
    next(error);
  }
});

router.put('/:type/:movieId', (req, res, next) => {
  try {
    const type = typeSchema.parse(req.params.type);
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const movie = movieSchema.parse({ ...req.body.movie, id: movieId });
    getDb()
      .prepare(
        `INSERT INTO list_items (user_id, movie_id, list_type, movie_snapshot)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, movie_id, list_type)
         DO UPDATE SET movie_snapshot = excluded.movie_snapshot`,
      )
      .run(req.user.id, movieId, type, movieSnapshot(movie));
    res.status(201).json({ active: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:type/:movieId', (req, res, next) => {
  try {
    const type = typeSchema.parse(req.params.type);
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    getDb()
      .prepare('DELETE FROM list_items WHERE user_id = ? AND movie_id = ? AND list_type = ?')
      .run(req.user.id, movieId, type);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
