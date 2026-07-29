import { ArrowRight } from 'lucide-react';
import { Link } from '../lib/router';
import { MovieCard } from './MovieCard';

export function MovieSection({ eyebrow, title, subtitle, movies = [], ranked = false, link = '/descubrir' }) {
  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Link className="section-link" to={link}>
          Ver todo <ArrowRight size={17} />
        </Link>
      </div>
      <div className="movie-row">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} rank={ranked ? index + 1 : null} />
        ))}
      </div>
    </section>
  );
}
