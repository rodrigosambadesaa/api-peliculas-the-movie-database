const { config } = require('../config');
const { demoHome, demoMovie, demoSearch } = require('./tmdbDemo');

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function hasCredentials() {
  return Boolean(config.tmdbToken || config.tmdbApiKey);
}

async function request(path, params = {}) {
  const url = new URL(`${config.tmdbBaseUrl}${path}`);
  Object.entries({
    language: config.language,
    ...params,
    ...(config.tmdbApiKey ? { api_key: config.tmdbApiKey } : {}),
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  });

  const key = url.toString();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL) return cached.data;

  let response;
  try {
    response = await fetch(url, {
      headers: config.tmdbToken
        ? { Authorization: `Bearer ${config.tmdbToken}`, accept: 'application/json' }
        : { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    const error = new Error('El catálogo de películas no está disponible ahora mismo.');
    error.code = 'TMDB_ERROR';
    error.status = 503;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? 'La credencial de TMDB no es válida.'
        : 'TMDB no ha podido completar la petición.',
    );
    error.code = 'TMDB_ERROR';
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }

  const data = await response.json();
  cache.set(key, { data, createdAt: Date.now() });
  return data;
}

async function getHome() {
  if (!hasCredentials()) return demoHome;
  const [trending, popular, topRated, upcoming, genres] = await Promise.all([
    request('/trending/movie/week'),
    request('/movie/popular', { region: config.region }),
    request('/movie/top_rated', { region: config.region }),
    request('/movie/upcoming', { region: config.region }),
    request('/genre/movie/list'),
  ]);
  return {
    hero: trending.results[0],
    trending: trending.results.slice(0, 12),
    popular: popular.results.slice(0, 12),
    topRated: topRated.results.slice(0, 12),
    upcoming: upcoming.results.slice(0, 12),
    genres: genres.genres,
    demoMode: false,
  };
}

async function searchMovies(query, page = 1) {
  if (!hasCredentials()) return demoSearch(query);
  return request('/search/movie', {
    query,
    page,
    include_adult: false,
    region: config.region,
  });
}

async function discoverMovies(params) {
  if (!hasCredentials()) return demoSearch('');
  return request('/discover/movie', {
    page: params.page || 1,
    sort_by: params.sortBy || 'popularity.desc',
    with_genres: params.genre,
    primary_release_year: params.year,
    'vote_average.gte': params.minRating,
    'vote_count.gte': params.minRating ? 100 : undefined,
    include_adult: false,
    region: config.region,
  });
}

async function getMovie(id) {
  if (!hasCredentials()) return demoMovie(Number(id));
  return request(`/movie/${id}`, {
    append_to_response: 'credits,videos,recommendations,similar,watch/providers',
  });
}

function clearCache() {
  cache.clear();
}

module.exports = {
  getHome,
  searchMovies,
  discoverMovies,
  getMovie,
  hasCredentials,
  clearCache,
};
