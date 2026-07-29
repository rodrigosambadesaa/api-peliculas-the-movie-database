const path = require('node:path');

const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  tmdbToken: process.env.TMDB_READ_TOKEN || '',
  tmdbApiKey: process.env.TMDB_API_KEY || '',
  tmdbBaseUrl: 'https://api.themoviedb.org/3',
  language: process.env.TMDB_LANGUAGE || 'es-ES',
  region: process.env.TMDB_REGION || 'ES',
  jwtSecret: process.env.JWT_SECRET || 'cinewave-local-secret-change-me',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  databasePath:
    process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cinewave.db'),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:5173',
};

module.exports = { config };
