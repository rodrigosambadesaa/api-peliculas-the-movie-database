const express = require('express');
const { z } = require('zod');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { movieSnapshot } = require('../utils');

const router = express.Router();
router.use(requireAuth);

router.put('/:movieId', (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const input = z
      .object({
        score: z.coerce.number().min(0.5).max(10),
        movie: z.object({
          id: z.coerce.number().int().positive(),
          title: z.string().min(1).max(200),
          poster_path: z.string().nullable().optional(),
          release_date: z.string().max(20).optional(),
          vote_average: z.coerce.number().min(0).max(10).optional(),
        }),
      })
      .parse(req.body);

    getDb()
      .prepare(
        `INSERT INTO ratings (user_id, movie_id, score, movie_snapshot)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, movie_id) DO UPDATE SET
           score = excluded.score,
           movie_snapshot = excluded.movie_snapshot,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .run(req.user.id, movieId, input.score, movieSnapshot({ ...input.movie, id: movieId }));
    res.json({ score: input.score });
  } catch (error) {
    next(error);
  }
});

router.delete('/:movieId', (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    getDb()
      .prepare('DELETE FROM ratings WHERE user_id = ? AND movie_id = ?')
      .run(req.user.id, movieId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
