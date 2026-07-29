const express = require('express');
const { z } = require('zod');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { movieSnapshot, parseSnapshot } = require('../utils');

const router = express.Router();

const reviewSchema = z.object({
  title: z.string().trim().min(3).max(100),
  content: z.string().trim().min(20).max(5000),
  containsSpoilers: z.boolean().default(false),
  movie: z.object({
    id: z.coerce.number().int().positive(),
    title: z.string().min(1).max(200),
    poster_path: z.string().nullable().optional(),
    release_date: z.string().max(20).optional(),
    vote_average: z.coerce.number().min(0).max(10).optional(),
  }),
});

function listReviews(movieId, viewerId) {
  return getDb()
    .prepare(
      `SELECT r.id, r.movie_id AS movieId, r.title, r.content,
              r.contains_spoilers AS containsSpoilers,
              r.created_at AS createdAt, r.updated_at AS updatedAt,
              u.id AS userId, u.name AS userName, u.username,
              u.avatar_color AS avatarColor,
              (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) AS likeCount,
              EXISTS(
                SELECT 1 FROM review_likes
                WHERE review_id = r.id AND user_id = @viewerId
              ) AS liked,
              (SELECT score FROM ratings
               WHERE user_id = r.user_id AND movie_id = r.movie_id) AS rating
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.movie_id = @movieId
       ORDER BY likeCount DESC, r.created_at DESC`,
    )
    .all({ movieId, viewerId: viewerId || -1 })
    .map((row) => ({
      ...row,
      containsSpoilers: Boolean(row.containsSpoilers),
      liked: Boolean(row.liked),
    }));
}

router.get('/latest', (req, res) => {
  const reviews = getDb()
    .prepare(
      `SELECT r.id, r.movie_id AS movieId, r.title, r.content,
              r.contains_spoilers AS containsSpoilers, r.movie_snapshot,
              r.created_at AS createdAt, u.name AS userName, u.username,
              u.avatar_color AS avatarColor,
              (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) AS likeCount,
              EXISTS(
                SELECT 1 FROM review_likes
                WHERE review_id = r.id AND user_id = @viewerId
              ) AS liked,
              (SELECT score FROM ratings
               WHERE user_id = r.user_id AND movie_id = r.movie_id) AS rating
       FROM reviews r JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC LIMIT 20`,
    )
    .all({ viewerId: req.user?.id || -1 })
    .map(parseSnapshot)
    .map(({ movie_snapshot, ...row }) => ({
      ...row,
      containsSpoilers: Boolean(row.containsSpoilers),
      liked: Boolean(row.liked),
    }));
  const stats = getDb()
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM users) AS members,
        (SELECT COUNT(*) FROM reviews) AS reviews,
        (SELECT COUNT(*) FROM ratings) AS ratings`,
    )
    .get();
  res.json({ reviews, stats });
});

router.get('/movie/:movieId', (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    res.json({ reviews: listReviews(movieId, req.user?.id) });
  } catch (error) {
    next(error);
  }
});

router.post('/movie/:movieId', requireAuth, (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const input = reviewSchema.parse(req.body);
    const db = getDb();
    const exists = db
      .prepare('SELECT id FROM reviews WHERE user_id = ? AND movie_id = ?')
      .get(req.user.id, movieId);
    if (exists) {
      return res.status(409).json({
        error: { code: 'REVIEW_EXISTS', message: 'Ya has publicado una reseña de esta película.' },
      });
    }

    const result = db
      .prepare(
        `INSERT INTO reviews
           (user_id, movie_id, title, content, contains_spoilers, movie_snapshot)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.user.id,
        movieId,
        input.title,
        input.content,
        Number(input.containsSpoilers),
        movieSnapshot({ ...input.movie, id: movieId }),
      );
    const review = listReviews(movieId, req.user.id).find(
      ({ id }) => id === Number(result.lastInsertRowid),
    );
    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});

router.patch('/:reviewId', requireAuth, (req, res, next) => {
  try {
    const reviewId = z.coerce.number().int().positive().parse(req.params.reviewId);
    const input = reviewSchema
      .pick({ title: true, content: true, containsSpoilers: true })
      .partial()
      .parse(req.body);
    const fields = [];
    const values = [];
    if (input.title !== undefined) {
      fields.push('title = ?');
      values.push(input.title);
    }
    if (input.content !== undefined) {
      fields.push('content = ?');
      values.push(input.content);
    }
    if (input.containsSpoilers !== undefined) {
      fields.push('contains_spoilers = ?');
      values.push(Number(input.containsSpoilers));
    }
    if (!fields.length) return res.status(204).end();
    const result = getDb()
      .prepare(
        `UPDATE reviews SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
      )
      .run(...values, reviewId, req.user.id);
    if (!result.changes) {
      return res.status(404).json({
        error: { code: 'REVIEW_NOT_FOUND', message: 'No se ha encontrado la reseña.' },
      });
    }
    res.json({ updated: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:reviewId', requireAuth, (req, res, next) => {
  try {
    const reviewId = z.coerce.number().int().positive().parse(req.params.reviewId);
    const result = getDb()
      .prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?')
      .run(reviewId, req.user.id);
    if (!result.changes) {
      return res.status(404).json({
        error: { code: 'REVIEW_NOT_FOUND', message: 'No se ha encontrado la reseña.' },
      });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.put('/:reviewId/like', requireAuth, (req, res, next) => {
  try {
    const reviewId = z.coerce.number().int().positive().parse(req.params.reviewId);
    getDb()
      .prepare('INSERT OR IGNORE INTO review_likes (user_id, review_id) VALUES (?, ?)')
      .run(req.user.id, reviewId);
    res.status(201).json({ liked: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:reviewId/like', requireAuth, (req, res, next) => {
  try {
    const reviewId = z.coerce.number().int().positive().parse(req.params.reviewId);
    getDb()
      .prepare('DELETE FROM review_likes WHERE user_id = ? AND review_id = ?')
      .run(req.user.id, reviewId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
