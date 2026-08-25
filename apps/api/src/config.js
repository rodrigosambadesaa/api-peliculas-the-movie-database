const path = require('node:path');

const DEVELOPMENT_JWT_SECRET = 'cinewave-local-secret-change-me';

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`[config] Expected a boolean value, received "${value}".`);
}

function parsePort(value) {
  const port = Number(value || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[config] PORT must be an integer between 1 and 65535, received "${value}".`);
  }
  return port;
}

function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '' || value === 'false') return false;
  if (value === 'true') return true;

  const hops = Number(value);
  if (Number.isInteger(hops) && hops >= 0) return hops;
  throw new Error(`[config] TRUST_PROXY must be true, false or a non-negative hop count.`);
}

function parseOrigins(value) {
  const origins = String(value || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      let parsed;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error(`[config] WEB_ORIGIN contains an invalid URL: "${origin}".`);
      }

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`[config] WEB_ORIGIN only supports http/https origins: "${origin}".`);
      }
      return parsed.origin;
    });

  if (origins.length === 0) {
    throw new Error('[config] WEB_ORIGIN must contain at least one allowed origin.');
  }
  return [...new Set(origins)];
}

function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const jwtSecret = env.JWT_SECRET || (nodeEnv === 'production' ? '' : DEVELOPMENT_JWT_SECRET);
  const webOrigins = parseOrigins(env.WEB_ORIGIN);

  if (nodeEnv === 'production' && jwtSecret.length < 32) {
    throw new Error('[config] JWT_SECRET must contain at least 32 characters in production.');
  }

  return Object.freeze({
    port: parsePort(env.PORT),
    nodeEnv,
    tmdbToken: env.TMDB_READ_TOKEN || '',
    tmdbApiKey: env.TMDB_API_KEY || '',
    tmdbBaseUrl: 'https://api.themoviedb.org/3',
    language: env.TMDB_LANGUAGE || 'es-ES',
    region: env.TMDB_REGION || 'ES',
    jwtSecret,
    cookieSecure: parseBoolean(env.COOKIE_SECURE),
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    databasePath: env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cinewave.db'),
    webOrigin: webOrigins.join(','),
    webOrigins,
  });
}

const config = loadConfig();

module.exports = { config, loadConfig, DEVELOPMENT_JWT_SECRET };
