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
});
