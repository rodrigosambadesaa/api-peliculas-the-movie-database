const request = require('supertest');
const { createApp } = require('./app');
const { createDatabase, setDb, closeDb } = require('./db');

const movie = {
  id: 157336,
  title: 'Interstellar',
  poster_path: '/poster.jpg',
  release_date: '2014-11-07',
  vote_average: 8.5,
};

describe('CineWave API', () => {
  let app;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    setDb(createDatabase(':memory:'));
    app = createApp();
  });

  afterEach(() => closeDb());

  it('expone el estado del servicio y el catálogo demo', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'cinewave-api',
      catalog: 'demo',
    });
  });

  it('registra una cuenta y recupera la sesión mediante cookie', async () => {
    const agent = request.agent(app);
    const registration = await agent
      .post('/api/auth/register')
      .send({
        name: 'Alex García',
        username: 'alexcine',
        email: 'alex@example.com',
        password: 'supersegura',
      })
      .expect(201);

    expect(registration.body.user).toMatchObject({
      name: 'Alex García',
      username: 'alexcine',
      email: 'alex@example.com',
    });
    expect(registration.headers['set-cookie'][0]).toContain('HttpOnly');

    const session = await agent.get('/api/auth/me').expect(200);
    expect(session.body.user.username).toBe('alexcine');
  });

  it('gestiona listas, puntuaciones y reseñas de un usuario', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Sam Cine',
      username: 'samcine',
      email: 'sam@example.com',
      password: 'supersegura',
    });

    await agent.put(`/api/library/favorite/${movie.id}`).send({ movie }).expect(201);
    await agent
      .put(`/api/ratings/${movie.id}`)
      .send({ movie, score: 9 })
      .expect(200);
    await agent
      .post(`/api/reviews/movie/${movie.id}`)
      .send({
        movie,
        title: 'Una experiencia inolvidable',
        content: 'Una película enorme y emotiva que mejora cada vez que vuelves a verla.',
        containsSpoilers: false,
      })
      .expect(201);

    const library = await agent.get('/api/library?type=favorite').expect(200);
    expect(library.body.items).toHaveLength(1);
    expect(library.body.items[0].movie.title).toBe('Interstellar');

    const reviews = await agent.get(`/api/reviews/movie/${movie.id}`).expect(200);
    expect(reviews.body.reviews[0]).toMatchObject({
      title: 'Una experiencia inolvidable',
      rating: 9,
    });

    const dashboard = await agent.get('/api/users/me/dashboard').expect(200);
    expect(dashboard.body.stats).toEqual({
      favorites: 1,
      watchlist: 0,
      ratings: 1,
      reviews: 1,
    });
  });

  it('rechaza operaciones privadas sin sesión', async () => {
    const response = await request(app).get('/api/library').expect(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('aplica los filtros y la ordenación al catálogo de demostración', async () => {
    const filtered = await request(app)
      .get('/api/movies/discover?genre=878&year=2010&minRating=8')
      .expect(200);
    expect(filtered.body.results.map(({ title }) => title)).toEqual(['Origen']);

    const sorted = await request(app)
      .get('/api/movies/discover?sortBy=primary_release_date.desc')
      .expect(200);
    const releaseDates = sorted.body.results.map(({ release_date: releaseDate }) => releaseDate);
    expect(releaseDates).toEqual([...releaseDates].sort().reverse());
  });

  it('devuelve 404 para una película inexistente en el catálogo demo', async () => {
    const response = await request(app).get('/api/movies/999999999').expect(404);
    expect(response.body.error.code).toBe('MOVIE_NOT_FOUND');
  });

  it('devuelve 404 al votar una reseña inexistente', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Noa Cine',
      username: 'noacine',
      email: 'noa@example.com',
      password: 'supersegura',
    });
    const response = await agent.put('/api/reviews/999/like').expect(404);
    expect(response.body.error.code).toBe('REVIEW_NOT_FOUND');
  });

  it('completa el ciclo de login, edición de perfil y logout', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Luz Cinema',
      username: 'luzcinema',
      email: 'luz@example.com',
      password: 'supersegura',
    });
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
    await agent
      .post('/api/auth/login')
      .send({ identity: 'LUZCINEMA', password: 'supersegura' })
      .expect(200);

    const updated = await agent
      .patch('/api/users/me')
      .send({ name: 'Luz de Cine', bio: 'Drama y ciencia ficción.', avatarColor: '#7657ff' })
      .expect(200);
    expect(updated.body.user).toMatchObject({
      name: 'Luz de Cine',
      bio: 'Drama y ciencia ficción.',
      avatarColor: '#7657ff',
    });

    const profile = await request(app).get('/api/users/luzcinema').expect(200);
    expect(profile.body.user.name).toBe('Luz de Cine');
    expect(profile.body.user.email).toBeUndefined();
  });

  it('actualiza y elimina listas y puntuaciones', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      name: 'Leo Film',
      username: 'leofilm',
      email: 'leo@example.com',
      password: 'supersegura',
    });
    await agent.put(`/api/library/watchlist/${movie.id}`).send({ movie }).expect(201);
    await agent.put(`/api/ratings/${movie.id}`).send({ movie, score: 7.5 }).expect(200);
    await agent.put(`/api/ratings/${movie.id}`).send({ movie, score: 9.5 }).expect(200);

    const detail = await agent.get(`/api/movies/${movie.id}`).expect(200);
    expect(detail.body.viewer).toMatchObject({ watchlist: true, favorite: false, rating: 9.5 });
    expect(detail.body.communityRating).toEqual({ average: 9.5, count: 1 });

    await agent.delete(`/api/library/watchlist/${movie.id}`).expect(204);
    await agent.delete(`/api/ratings/${movie.id}`).expect(204);
    const library = await agent.get('/api/library').expect(200);
    expect(library.body.items).toEqual([]);
    const ratings = await agent.get('/api/users/me/ratings').expect(200);
    expect(ratings.body.ratings).toEqual([]);
  });

  it('permite editar, votar y eliminar una reseña', async () => {
    const author = request.agent(app);
    await author.post('/api/auth/register').send({
      name: 'Ana Autor',
      username: 'anaautor',
      email: 'ana@example.com',
      password: 'supersegura',
    });
    const created = await author
      .post(`/api/reviews/movie/${movie.id}`)
      .send({
        movie,
        title: 'Primera impresión',
        content: 'Una reseña suficientemente extensa para poder publicarla.',
        containsSpoilers: false,
      })
      .expect(201);
    const reviewId = created.body.review.id;

    await author
      .patch(`/api/reviews/${reviewId}`)
      .send({ title: 'Impresión revisada', containsSpoilers: true })
      .expect(200);

    const reader = request.agent(app);
    await reader.post('/api/auth/register').send({
      name: 'Eva Lectora',
      username: 'evalectora',
      email: 'eva@example.com',
      password: 'supersegura',
    });
    await reader.put(`/api/reviews/${reviewId}/like`).expect(201);
    let reviews = await reader.get(`/api/reviews/movie/${movie.id}`).expect(200);
    expect(reviews.body.reviews[0]).toMatchObject({
      title: 'Impresión revisada',
      containsSpoilers: true,
      liked: true,
      likeCount: 1,
    });
    await reader.delete(`/api/reviews/${reviewId}/like`).expect(204);
    await author.delete(`/api/reviews/${reviewId}`).expect(204);
    reviews = await request(app).get(`/api/reviews/movie/${movie.id}`).expect(200);
    expect(reviews.body.reviews).toEqual([]);
  });

  it('mantiene operativo el endpoint compatible del proyecto original', async () => {
    const response = await request(app).get('/busqueda').query({ name: '"Interstellar"' }).expect(200);
    expect(response.body).toMatchObject({
      titulo: 'Interstellar',
      titulo_original: 'Interstellar',
    });
    expect(response.body.peliculas_similares.length).toBeGreaterThan(0);
  });
});
