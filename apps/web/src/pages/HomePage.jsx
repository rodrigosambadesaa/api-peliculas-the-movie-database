import { useEffect, useState } from 'react';
import { ArrowRight, Bookmark, Play, Search, Sparkles, Star, Users } from 'lucide-react';
import { Link, useNavigate } from '../lib/router';
import { api, imageUrl, yearOf } from '../lib/api';
import { MovieSection } from '../components/MovieSection';
import { MovieCardSkeleton } from '../components/MovieCard';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [heroSaved, setHeroSaved] = useState(false);
  const navigate = useNavigate();
  const { requireUser } = useAuth();

  useEffect(() => {
    api.get('/movies/home').then(setData).catch((requestError) => setError(requestError.message));
  }, []);

  if (error) {
    return (
      <main className="state-page">
        <span className="state-icon">!</span>
        <h1>No pudimos abrir la cartelera</h1>
        <p>{error}</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Volver a intentar
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main>
        <section className="hero hero-loading">
          <div className="container hero-content">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-copy" />
          </div>
        </section>
        <section className="content-section">
          <div className="skeleton skeleton-heading" />
          <div className="movie-row">
            {Array.from({ length: 6 }, (_, index) => <MovieCardSkeleton key={index} />)}
          </div>
        </section>
      </main>
    );
  }

  const hero = data.hero;

  function search(event) {
    event.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <main>
      <section
        className="hero"
        style={{ '--hero-image': `url(${imageUrl(hero.backdrop_path, 'original')})` }}
      >
        <div className="hero-grain" />
        <div className="container hero-content">
          <span className="hero-kicker">
            <Sparkles size={15} /> Película destacada de la semana
          </span>
          <h1>{hero.title}</h1>
          <div className="hero-meta">
            <span>{yearOf(hero.release_date)}</span>
            <span className="hero-rating">
              <Star size={17} fill="currentColor" /> {Number(hero.vote_average).toFixed(1)}
            </span>
            <span>La conversación del momento</span>
          </div>
          <p>{hero.overview}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to={`/pelicula/${hero.id}`}>
              <Play size={18} fill="currentColor" /> Ver detalles
            </Link>
            <button
              className={`button ${heroSaved ? 'button-active' : 'button-glass'}`}
              onClick={() =>
                requireUser(async () => {
                  try {
                    if (heroSaved) {
                      await api.delete(`/library/watchlist/${hero.id}`);
                    } else {
                      await api.put(`/library/watchlist/${hero.id}`, {
                        movie: {
                          id: hero.id,
                          title: hero.title,
                          poster_path: hero.poster_path,
                          release_date: hero.release_date,
                          vote_average: hero.vote_average,
                        },
                      });
                    }
                    setHeroSaved((value) => !value);
                  } catch {
                    // Conserva el estado visual si la petición no se completa.
                  }
                })
              }
            >
              <Bookmark size={18} /> {heroSaved ? 'En mi lista' : 'Añadir a mi lista'}
            </button>
          </div>
        </div>
        <div className="hero-search-wrap container">
          <form className="hero-search" onSubmit={search}>
            <Search size={22} />
            <div>
              <small>Encuentra tu próxima historia</small>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca por título, director o actor..."
                aria-label="Buscar en el catálogo"
              />
            </div>
            <button>
              Buscar <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>

      {data.demoMode && (
        <div className="demo-notice container">
          <Sparkles size={17} />
          <span>
            Estás viendo el catálogo de demostración. Añade tu acceso de TMDB para explorar miles de películas.
          </span>
        </div>
      )}

      <MovieSection
        eyebrow="Ahora mismo"
        title="Tendencias que no paran de crecer"
        subtitle="Las películas de las que todo el mundo está hablando."
        movies={data.trending}
      />

      <section className="community-banner container">
        <div>
          <span className="eyebrow">Cine que se comparte</span>
          <h2>Tu opinión también forma parte de la historia.</h2>
          <p>
            Puntúa lo que ves, escribe reseñas sin límites y encuentra tu próxima obsesión
            a través de una comunidad que ama el cine tanto como tú.
          </p>
          <Link className="button button-light" to="/comunidad">
            <Users size={18} /> Descubrir la comunidad
          </Link>
        </div>
        <div className="community-stats">
          <span>
            <strong>10</strong>
            puntos para afinar tu criterio
          </span>
          <span>
            <strong>∞</strong>
            historias por descubrir
          </span>
          <span>
            <strong>1</strong>
            espacio hecho para ti
          </span>
        </div>
      </section>

      <MovieSection
        eyebrow="Las imprescindibles"
        title="Mejor valoradas"
        subtitle="Obras que han dejado huella, ordenadas por la comunidad."
        movies={data.topRated}
        ranked
        link="/descubrir?sortBy=vote_average.desc"
      />

      <MovieSection
        eyebrow="Próximamente"
        title="Apunta estas fechas"
        subtitle="Lo que está a punto de llegar a la gran pantalla."
        movies={data.upcoming}
        link="/descubrir?sortBy=primary_release_date.desc"
      />

      <section className="genre-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Explora a tu manera</span>
            <h2>Elige un género, entra en otro mundo</h2>
          </div>
        </div>
        <div className="genre-grid">
          {data.genres.slice(0, 10).map((genre, index) => (
            <Link key={genre.id} to={`/descubrir?genre=${genre.id}`} style={{ '--genre-index': index }}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {genre.name}
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
