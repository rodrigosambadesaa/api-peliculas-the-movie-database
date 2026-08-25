const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const { config } = require('./config');
const { currentUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errors');
const tmdb = require('./services/tmdb');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const libraryRoutes = require('./routes/library');
const ratingRoutes = require('./routes/ratings');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: config.webOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  if (config.nodeEnv !== 'test') {
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res, _next, options) =>
        res.status(options.statusCode).json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiados intentos de autenticación. Inténtalo de nuevo más tarde.',
          },
        }),
    });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
  }

  app.use(currentUser);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'cinewave-api',
      catalog: tmdb.hasCredentials() ? 'tmdb' : 'demo',
    });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/users', userRoutes);

  // Compatibilidad con el endpoint del proyecto original.
  app.get('/busqueda', async (req, res, next) => {
    try {
      const result = await tmdb.searchMovies(String(req.query.name || '').replaceAll('"', ''));
      const first = result.results?.[0];
      if (!first) {
        return res.status(404).json({
          error: { code: 'MOVIE_NOT_FOUND', message: 'No se ha encontrado ninguna película.' },
        });
      }
      const detail = await tmdb.getMovie(first.id);
      res.json({
        titulo: detail.title,
        titulo_original: detail.original_title,
        puntuacion_media: detail.vote_average,
        fecha_estreno: detail.release_date,
        sinopsis: detail.overview,
        peliculas_similares: (detail.similar?.results || []).slice(0, 5).map((movie) => ({
          titulo: movie.title,
          titulo_original: movie.original_title,
          puntuacion_media: movie.vote_average,
          fecha_estreno: movie.release_date,
          sinopsis: movie.overview,
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
