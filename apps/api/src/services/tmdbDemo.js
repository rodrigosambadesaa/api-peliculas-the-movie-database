const movies = [
  {
    id: 157336,
    title: 'Interstellar',
    original_title: 'Interstellar',
    overview:
      'Un grupo de exploradores viaja más allá de nuestra galaxia para descubrir si la humanidad tiene futuro entre las estrellas.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-07',
    vote_average: 8.5,
    vote_count: 36000,
    genre_ids: [12, 18, 878],
    popularity: 140,
  },
  {
    id: 27205,
    title: 'Origen',
    original_title: 'Inception',
    overview:
      'Un ladrón que roba secretos a través de los sueños recibe la oportunidad de borrar su pasado.',
    poster_path: '/tXQvtRWfkUUnWJAn2tN3jERIUG.jpg',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    release_date: '2010-08-06',
    vote_average: 8.4,
    vote_count: 37000,
    genre_ids: [28, 878, 12],
    popularity: 120,
  },
  {
    id: 155,
    title: 'El caballero oscuro',
    original_title: 'The Dark Knight',
    overview:
      'Batman se enfrenta a un criminal que sumerge Gotham en el caos y pone a prueba sus convicciones.',
    poster_path: '/8QDQExnfNFOtabLDKqfDQuHDsIg.jpg',
    backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    release_date: '2008-08-13',
    vote_average: 8.5,
    vote_count: 33000,
    genre_ids: [18, 28, 80],
    popularity: 115,
  },
  {
    id: 496243,
    title: 'Parásitos',
    original_title: '기생충',
    overview:
      'Una familia con pocos recursos se introduce poco a poco en el hogar de una familia adinerada.',
    poster_path: '/4N55tgxDW0RRATyrZHbx0q9HUKv.jpg',
    backdrop_path: '/TU9NIjwzjoKPwQHoHshkBcQ8se.jpg',
    release_date: '2019-10-25',
    vote_average: 8.5,
    vote_count: 18000,
    genre_ids: [35, 53, 18],
    popularity: 90,
  },
  {
    id: 13,
    title: 'Forrest Gump',
    original_title: 'Forrest Gump',
    overview:
      'La vida de un hombre bondadoso se cruza con algunos de los momentos decisivos del siglo XX.',
    poster_path: '/oiqKEhEfxl9knzWXvWecJKN3aj6.jpg',
    backdrop_path: '/qdIMHd4sEfJSckfVJfKQvisL02a.jpg',
    release_date: '1994-09-23',
    vote_average: 8.5,
    vote_count: 28000,
    genre_ids: [35, 18, 10749],
    popularity: 85,
  },
  {
    id: 680,
    title: 'Pulp Fiction',
    original_title: 'Pulp Fiction',
    overview:
      'Varias historias de crimen en Los Ángeles convergen en una narración tan violenta como ingeniosa.',
    poster_path: '/hNcQAuquJxTxl2fJFs1R42DrWcf.jpg',
    backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
    release_date: '1995-01-13',
    vote_average: 8.5,
    vote_count: 28000,
    genre_ids: [53, 80],
    popularity: 82,
  },
  {
    id: 372058,
    title: 'Your Name',
    original_title: '君の名は。',
    overview:
      'Dos adolescentes descubren que intercambian sus cuerpos y crean un vínculo que desafía el tiempo.',
    poster_path: '/iaiy3tg9QVkDpObm1IGqmbC9A5C.jpg',
    backdrop_path: '/7OMAfDJikBxItZBIug0NJig5DHD.jpg',
    release_date: '2017-04-07',
    vote_average: 8.5,
    vote_count: 12000,
    genre_ids: [16, 10749, 18],
    popularity: 78,
  },
  {
    id: 129,
    title: 'El viaje de Chihiro',
    original_title: '千と千尋の神隠し',
    overview:
      'Una niña entra en un mundo mágico gobernado por dioses, brujas y espíritus.',
    poster_path: '/laXrmaTRuroArSPfsGlvTbeWxVA.jpg',
    backdrop_path: '/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    release_date: '2002-10-25',
    vote_average: 8.5,
    vote_count: 17000,
    genre_ids: [16, 10751, 14],
    popularity: 75,
  },
  {
    id: 278,
    title: 'Cadena perpetua',
    original_title: 'The Shawshank Redemption',
    overview:
      'Dos hombres encarcelados forjan una amistad y encuentran redención a través de la compasión.',
    poster_path: '/d7dZJMEBwuhdHyx7FC1pTRVtN9P.jpg',
    backdrop_path: '/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg',
    release_date: '1995-02-24',
    vote_average: 8.7,
    vote_count: 28000,
    genre_ids: [18, 80],
    popularity: 110,
  },
  {
    id: 603,
    title: 'Matrix',
    original_title: 'The Matrix',
    overview:
      'Un programador descubre que el mundo que conoce es una simulación y se une a una rebelión.',
    poster_path: '/qK76PKQLd6zlMn0u83Ej9YQOqPL.jpg',
    backdrop_path: '/icmmSD4vTTDKOq2vvdulafOGw93.jpg',
    release_date: '1999-06-23',
    vote_average: 8.2,
    vote_count: 26000,
    genre_ids: [28, 878],
    popularity: 98,
  },
  {
    id: 475557,
    title: 'Joker',
    original_title: 'Joker',
    overview:
      'Un hombre ignorado por la sociedad emprende un descenso hacia la locura en la ciudad de Gotham.',
    poster_path: '/v0eQLbzT6sWelfApuYsEkYpzufl.jpg',
    backdrop_path: '/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
    release_date: '2019-10-04',
    vote_average: 8.1,
    vote_count: 26000,
    genre_ids: [80, 53, 18],
    popularity: 88,
  },
  {
    id: 244786,
    title: 'Whiplash',
    original_title: 'Whiplash',
    overview:
      'Un joven batería de jazz lleva su talento al límite bajo la tutela de un instructor implacable.',
    poster_path: '/sL32IZkyDlMnTP7oWwGArRyO8mY.jpg',
    backdrop_path: '/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg',
    release_date: '2015-01-16',
    vote_average: 8.4,
    vote_count: 15000,
    genre_ids: [18, 10402],
    popularity: 72,
  },
];

const genres = [
  { id: 28, name: 'Acción' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animación' },
  { id: 35, name: 'Comedia' },
  { id: 80, name: 'Crimen' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasía' },
  { id: 878, name: 'Ciencia ficción' },
  { id: 53, name: 'Suspense' },
  { id: 10749, name: 'Romance' },
];

const demoHome = {
  hero: movies[0],
  trending: movies.slice(0, 8),
  popular: [...movies].reverse().slice(0, 8),
  topRated: [...movies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 8),
  upcoming: movies.slice(3, 11),
  genres,
  demoMode: true,
};

function demoSearch(query) {
  const normalized = query.trim().toLocaleLowerCase('es');
  const results = normalized
    ? movies.filter(
        (movie) =>
          movie.title.toLocaleLowerCase('es').includes(normalized) ||
          movie.original_title.toLocaleLowerCase('es').includes(normalized),
      )
    : movies;
  return { page: 1, total_pages: 1, total_results: results.length, results };
}

function demoMovie(id) {
  const movie = movies.find((entry) => entry.id === id) || movies[0];
  return {
    ...movie,
    runtime: 169,
    tagline: 'El final de la Tierra no será el final de la humanidad.',
    status: 'Released',
    budget: 165000000,
    revenue: 731000000,
    genres: movie.genre_ids.map((genreId) => genres.find(({ id: value }) => value === genreId)),
    production_countries: [{ iso_3166_1: 'US', name: 'Estados Unidos' }],
    credits: {
      cast: [
        { id: 1, name: 'Matthew McConaughey', character: 'Cooper', profile_path: null },
        { id: 2, name: 'Anne Hathaway', character: 'Brand', profile_path: null },
        { id: 3, name: 'Jessica Chastain', character: 'Murph', profile_path: null },
        { id: 4, name: 'Michael Caine', character: 'Professor Brand', profile_path: null },
        { id: 5, name: 'Mackenzie Foy', character: 'Murph joven', profile_path: null },
      ],
      crew: [{ id: 6, name: 'Christopher Nolan', job: 'Director' }],
    },
    videos: { results: [] },
    recommendations: { results: movies.filter((entry) => entry.id !== movie.id).slice(0, 8) },
    similar: { results: movies.filter((entry) => entry.id !== movie.id).slice(3, 9) },
    'watch/providers': { results: {} },
  };
}

module.exports = { demoHome, demoMovie, demoSearch };
