import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  PenLine,
  Play,
  Share2,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Link, useParams } from '../lib/router';
import { api, formatRuntime, imageUrl, yearOf } from '../lib/api';
import { MovieSection } from '../components/MovieSection';
import { RatingPicker } from '../components/RatingPicker';
import { ReviewCard } from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';

function moviePayload(movie) {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  };
}

export function MoviePage() {
  const { id } = useParams();
  const { user, requireUser } = useAuth();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    try {
      const [movieData, reviewData] = await Promise.all([
        api.get(`/movies/${id}`),
        api.get(`/reviews/movie/${id}`),
      ]);
      setMovie(movieData);
      setReviews(reviewData.reviews);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [id]);

  useEffect(() => {
    setMovie(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const trailer = useMemo(
    () =>
      movie?.videos?.results?.find(
        (video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official,
      ) || movie?.videos?.results?.find((video) => video.site === 'YouTube'),
    [movie],
  );

  if (error) {
    return (
      <main className="state-page">
        <span className="state-icon">!</span>
        <h1>No hemos encontrado esa película</h1>
        <p>{error}</p>
        <Link className="button button-primary" to="/descubrir">Volver a explorar</Link>
      </main>
    );
  }

  if (!movie) return <MoviePageSkeleton />;

  async function toggleList(type) {
    requireUser(async () => {
      const key = type === 'favorite' ? 'favorite' : 'watchlist';
      const next = !movie.viewer?.[key];
      setMovie((current) => ({
        ...current,
        viewer: { ...current.viewer, [key]: next },
      }));
      try {
        if (next) await api.put(`/library/${type}/${movie.id}`, { movie: moviePayload(movie) });
        else await api.delete(`/library/${type}/${movie.id}`);
        setToast(
          next
            ? type === 'favorite'
              ? 'Añadida a tus favoritas'
              : 'Añadida a tu lista'
            : 'Eliminada de tu biblioteca',
        );
      } catch (requestError) {
        setMovie((current) => ({
          ...current,
          viewer: { ...current.viewer, [key]: !next },
        }));
        setToast(requestError.message);
      }
    });
  }

  async function rate(score) {
    requireUser(async () => {
      await api.put(`/ratings/${movie.id}`, { score, movie: moviePayload(movie) });
      setMovie((current) => ({
        ...current,
        viewer: { ...current.viewer, rating: score },
      }));
      setToast(`Tu puntuación: ${score}/10`);
    });
  }

  async function share() {
    try {
      await navigator.share?.({ title: movie.title, url: window.location.href });
    } catch {
      // El usuario puede cancelar el diálogo del sistema.
    }
    if (!navigator.share) {
      await navigator.clipboard.writeText(window.location.href);
      setToast('Enlace copiado');
    }
  }

  const director = movie.credits?.crew?.find((member) => member.job === 'Director');

  return (
    <main className="movie-page">
      {toast && (
        <div className="toast">
          <Check size={17} /> {toast}
        </div>
      )}
      <section
        className="movie-detail-hero"
        style={{ '--detail-backdrop': `url(${imageUrl(movie.backdrop_path, 'original')})` }}
      >
        <div className="container movie-hero-grid">
          <div className="detail-poster">
            {movie.poster_path ? (
              <img src={imageUrl(movie.poster_path, 'w500')} alt={`Cartel de ${movie.title}`} />
            ) : (
              <span>Sin cartel</span>
            )}
            {trailer && (
              <a
                className="trailer-button"
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
              >
                <Play size={18} fill="currentColor" /> Ver tráiler
              </a>
            )}
          </div>

          <div className="detail-copy">
            <div className="detail-breadcrumb">
              <Link to="/">Inicio</Link><span>/</span><Link to="/descubrir">Películas</Link>
            </div>
            <span className="eyebrow">{movie.tagline || 'Una historia para recordar'}</span>
            <h1>{movie.title}</h1>
            {movie.original_title !== movie.title && <p className="original-title">{movie.original_title}</p>}
            <div className="detail-meta">
              <span><CalendarDays size={17} /> {yearOf(movie.release_date)}</span>
              {movie.runtime && <span><Clock3 size={17} /> {formatRuntime(movie.runtime)}</span>}
              <span>+13</span>
            </div>
            <div className="genre-pills">
              {movie.genres?.map((genre) => (
                <Link key={genre.id} to={`/descubrir?genre=${genre.id}`}>{genre.name}</Link>
              ))}
            </div>
            <p className="detail-overview">{movie.overview || 'Sin sinopsis disponible.'}</p>

            <div className="score-row">
              <div className="main-score">
                <Star size={28} fill="currentColor" />
                <span><strong>{Number(movie.vote_average || 0).toFixed(1)}</strong><small>/10 en TMDB</small></span>
              </div>
              <div>
                <Users size={23} />
                <span>
                  <strong>{movie.communityRating.average || '—'}</strong>
                  <small>{movie.communityRating.count} votos CineWave</small>
                </span>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className={`button ${movie.viewer?.watchlist ? 'button-active' : 'button-primary'}`}
                onClick={() => toggleList('watchlist')}
              >
                {movie.viewer?.watchlist ? <Check size={18} /> : <Bookmark size={18} />}
                {movie.viewer?.watchlist ? 'En mi lista' : 'Añadir a mi lista'}
              </button>
              <button
                className={`icon-action ${movie.viewer?.favorite ? 'active' : ''}`}
                onClick={() => toggleList('favorite')}
                aria-label="Marcar como favorita"
              >
                <Heart fill={movie.viewer?.favorite ? 'currentColor' : 'none'} />
              </button>
              <button className="icon-action" onClick={share} aria-label="Compartir">
                <Share2 />
              </button>
            </div>

            {(director || movie.production_countries?.[0]) && (
              <dl className="credit-summary">
                {director && <><dt>Dirección</dt><dd>{director.name}</dd></>}
                {movie.production_countries?.[0] && (
                  <><dt>País</dt><dd>{movie.production_countries[0].name}</dd></>
                )}
              </dl>
            )}
          </div>
        </div>
      </section>

      <section className="container detail-content">
        <div className="detail-main">
          <section className="rate-panel">
            <div>
              <span className="eyebrow">Tu voz cuenta</span>
              <h2>¿Qué te ha parecido?</h2>
              <p>Puntúa la película y ayuda a otros cinéfilos a decidir.</p>
            </div>
            <RatingPicker value={movie.viewer?.rating} onChange={rate} />
          </section>

          {movie.credits?.cast?.length > 0 && (
            <section className="cast-section">
              <div className="section-heading">
                <div><span className="eyebrow">Delante de la cámara</span><h2>Reparto principal</h2></div>
              </div>
              <div className="cast-row">
                {movie.credits.cast.slice(0, 8).map((person) => (
                  <article key={`${person.id}-${person.character}`}>
                    <span className="cast-photo">
                      {person.profile_path ? (
                        <img src={imageUrl(person.profile_path, 'w185')} alt={person.name} loading="lazy" />
                      ) : (
                        person.name.split(' ').map((part) => part[0]).slice(0, 2).join('')
                      )}
                    </span>
                    <strong>{person.name}</strong>
                    <small>{person.character}</small>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="reviews-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">La comunidad opina</span>
                <h2>Reseñas de espectadores</h2>
              </div>
              <button
                className="button button-outline"
                onClick={() => requireUser(() => setReviewOpen(true))}
              >
                <PenLine size={17} /> Escribir reseña
              </button>
            </div>
            <div className="reviews-list">
              {reviews.length ? (
                reviews.map((review) => <ReviewCard key={review.id} review={review} />)
              ) : (
                <div className="empty-reviews">
                  <PenLine />
                  <h3>Sé la primera persona en reseñarla</h3>
                  <p>Comparte qué te ha hecho sentir, sin contar más de la cuenta.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="movie-facts">
          <span className="eyebrow">Ficha técnica</span>
          <h3>Datos de la película</h3>
          <dl>
            <div><dt>Estado</dt><dd>{movie.status === 'Released' ? 'Estrenada' : movie.status}</dd></div>
            <div><dt>Estreno</dt><dd>{movie.release_date || '—'}</dd></div>
            <div><dt>Duración</dt><dd>{formatRuntime(movie.runtime) || '—'}</dd></div>
            <div><dt>Idioma original</dt><dd>{movie.original_language?.toUpperCase() || '—'}</dd></div>
            {movie.budget > 0 && (
              <div><dt>Presupuesto</dt><dd>{Intl.NumberFormat('es', { style: 'currency', currency: 'USD', notation: 'compact' }).format(movie.budget)}</dd></div>
            )}
          </dl>
        </aside>
      </section>

      {movie.recommendations?.results?.length > 0 && (
        <MovieSection
          eyebrow="Sigue explorando"
          title="También podrían gustarte"
          movies={movie.recommendations.results.slice(0, 10)}
        />
      )}

      {reviewOpen && (
        <ReviewComposer
          movie={movie}
          onClose={() => setReviewOpen(false)}
          onCreated={(review) => {
            setReviews((current) => [review, ...current]);
            setReviewOpen(false);
            setToast('Tu reseña ya forma parte de CineWave');
          }}
        />
      )}
    </main>
  );
}

function ReviewComposer({ movie, onClose, onCreated }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const result = await api.post(`/reviews/movie/${movie.id}`, {
        title: data.get('title'),
        content: data.get('content'),
        containsSpoilers: data.get('spoilers') === 'on',
        movie: moviePayload(movie),
      });
      onCreated(result.review);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="review-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X /></button>
        <span className="eyebrow">Tu reseña</span>
        <h2>¿Qué te pareció {movie.title}?</h2>
        <p>Escribe desde tu experiencia. Las mejores reseñas ayudan sin destripar la película.</p>
        <form onSubmit={submit}>
          <label>
            Un título que resuma tu opinión
            <input name="title" required minLength="3" maxLength="100" placeholder="Una odisea que se queda contigo" />
          </label>
          <label>
            Tu reseña
            <textarea name="content" required minLength="20" maxLength="5000" rows="7" placeholder="Cuéntanos qué funciona, qué no y qué te hizo sentir..." />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" name="spoilers" />
            <span>Esta reseña contiene spoilers</span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button button-ghost" onClick={onClose}>Cancelar</button>
            <button className="button button-primary" disabled={pending}>
              {pending ? 'Publicando…' : 'Publicar reseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MoviePageSkeleton() {
  return (
    <main className="movie-page">
      <section className="movie-detail-hero detail-loading">
        <div className="container movie-hero-grid">
          <div className="detail-poster skeleton" />
          <div className="detail-copy">
            <div className="skeleton skeleton-label" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-copy" />
            <div className="skeleton skeleton-copy" />
          </div>
        </div>
      </section>
    </main>
  );
}
