const express = require('express');
const { z } = require('zod');
const tmdb = require('../services/tmdb');
const { getDb } = require('../db');

const router = express.Router();

router.get('/home', async (_req, res, next) => {
  try {
    res.json(await tmdb.getHome());
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const query = z.string().trim().min(1).max(100).parse(req.query.q);
    const page = z.coerce.number().int().min(1).max(500).default(1).parse(req.query.page);
    res.json(await tmdb.searchMovies(query, page));
  } catch (error) {
    next(error);
  }
});

router.get('/discover', async (req, res, next) => {
  try {
    const input = z
      .object({
        page: z.coerce.number().int().min(1).max(500).optional(),
        sortBy: z
          .enum([
            'popularity.desc',
            'vote_average.desc',
            'primary_release_date.desc',
            'revenue.desc',
          ])
          .optional(),
        genre: z.coerce.number().int().positive().optional(),
        year: z.coerce.number().int().min(1870).max(2100).optional(),
        minRating: z.coerce.number().min(0).max(10).optional(),
      })
      .parse(req.query);
    res.json(await tmdb.discoverMovies(input));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const movie = await tmdb.getMovie(id);
    const db = getDb();
    const community = db
      .prepare(
        `SELECT ROUND(AVG(score), 1) AS average, COUNT(*) AS count
         FROM ratings WHERE movie_id = ?`,
      )
      .get(id);

    let viewer = null;
    if (req.user) {
      const rating = db
        .prepare('SELECT score FROM ratings WHERE user_id = ? AND movie_id = ?')
        .get(req.user.id, id);
      const listRows = db
        .prepare('SELECT list_type FROM list_items WHERE user_id = ? AND movie_id = ?')
        .all(req.user.id, id);
      viewer = {
        rating: rating?.score || null,
        favorite: listRows.some((row) => row.list_type === 'favorite'),
        watchlist: listRows.some((row) => row.list_type === 'watchlist'),
      };
    }

    res.json({
      ...movie,
      communityRating: {
        average: Number(community.average || 0),
        count: community.count,
      },
      viewer,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
