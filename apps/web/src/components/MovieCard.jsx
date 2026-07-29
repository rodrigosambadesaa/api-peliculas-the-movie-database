import { Bookmark, ImageOff, Star } from 'lucide-react';
import { Link } from '../lib/router';
import { imageUrl, yearOf } from '../lib/api';

export function MovieCard({ movie, rank, compact = false }) {
  return (
    <article className={`movie-card ${compact ? 'compact' : ''}`}>
      <Link className="movie-poster" to={`/pelicula/${movie.id}`} aria-label={`Ver ${movie.title}`}>
        {movie.poster_path ? (
          <img src={imageUrl(movie.poster_path)} alt={`Cartel de ${movie.title}`} loading="lazy" />
        ) : (
          <span className="poster-placeholder">
            <ImageOff />
            Sin cartel
          </span>
        )}
        {rank && <span className="rank-number">{String(rank).padStart(2, '0')}</span>}
        <span className="card-overlay">
          <span>Ver detalles</span>
        </span>
      </Link>
      <div className="movie-card-body">
        <div>
          <Link to={`/pelicula/${movie.id}`}>{movie.title}</Link>
          <p>
            {yearOf(movie.release_date)}
            {movie.original_language && ` · ${movie.original_language.toUpperCase()}`}
          </p>
        </div>
        <span className="card-rating">
          <Star size={14} fill="currentColor" />
          {Number(movie.vote_average || 0).toFixed(1)}
        </span>
      </div>
    </article>
  );
}

export function MovieCardSkeleton() {
  return (
    <article className="movie-card skeleton-card" aria-hidden="true">
      <div className="movie-poster skeleton" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </article>
  );
}
