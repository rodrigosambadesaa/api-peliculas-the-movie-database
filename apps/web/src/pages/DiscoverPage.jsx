import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from '../lib/router';
import { api } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';

const genreOptions = [
  [28, 'Acción'],
  [12, 'Aventura'],
  [16, 'Animación'],
  [35, 'Comedia'],
  [80, 'Crimen'],
  [99, 'Documental'],
  [18, 'Drama'],
  [14, 'Fantasía'],
  [27, 'Terror'],
  [878, 'Ciencia ficción'],
  [53, 'Suspense'],
  [10749, 'Romance'],
];

export function DiscoverPage({ searchMode = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [query, setQuery] = useState(params.get('q') || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const genre = params.get('genre') || '';
  const sortBy = params.get('sortBy') || 'popularity.desc';
  const year = params.get('year') || '';
  const minRating = params.get('minRating') || '';

  useEffect(() => {
    setData(null);
    setError('');
    const path = searchMode
      ? `/movies/search?q=${encodeURIComponent(params.get('q') || '')}`
      : `/movies/discover?${params.toString()}`;
    api.get(path).then(setData).catch((requestError) => setError(requestError.message));
  }, [location.search, searchMode, params]);

  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    navigate(`${searchMode ? '/buscar' : '/descubrir'}?${next.toString()}`);
  }

  function submit(event) {
    event.preventDefault();
    if (query.trim()) navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  const heading = searchMode
    ? params.get('q')
      ? `Resultados para “${params.get('q')}”`
      : 'Busca una película'
    : 'Encuentra algo que te mueva';

  return (
    <main className="listing-page container">
      <div className="listing-intro">
        <span className="eyebrow">{searchMode ? 'Búsqueda' : 'Explorar catálogo'}</span>
        <h1>{heading}</h1>
        <p>
          {searchMode
            ? `${data?.total_results || 0} películas encontradas en el catálogo.`
            : 'Filtra miles de historias por género, año y valoración.'}
        </p>
      </div>

      <form className="catalog-search" onSubmit={submit}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título de la película..."
          aria-label="Título de la película"
        />
        <button className="button button-primary">Buscar</button>
      </form>

      {!searchMode && (
        <section className={`filters-panel ${filtersOpen ? 'is-open' : ''}`}>
          <button className="filters-toggle" onClick={() => setFiltersOpen((value) => !value)}>
            <SlidersHorizontal size={18} /> Filtros
          </button>
          <div className="filters-fields">
            <label>
              Género
              <select value={genre} onChange={(event) => update('genre', event.target.value)}>
                <option value="">Todos los géneros</option>
                {genreOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              Ordenar por
              <select value={sortBy} onChange={(event) => update('sortBy', event.target.value)}>
                <option value="popularity.desc">Más populares</option>
                <option value="vote_average.desc">Mejor valoradas</option>
                <option value="primary_release_date.desc">Más recientes</option>
                <option value="revenue.desc">Mayor recaudación</option>
              </select>
            </label>
            <label>
              Año
              <input
                type="number"
                min="1870"
                max="2100"
                value={year}
                onChange={(event) => update('year', event.target.value)}
                placeholder="Cualquiera"
              />
            </label>
            <label>
              Nota mínima
              <select value={minRating} onChange={(event) => update('minRating', event.target.value)}>
                <option value="">Cualquiera</option>
                <option value="5">5 o más</option>
                <option value="6">6 o más</option>
                <option value="7">7 o más</option>
                <option value="8">8 o más</option>
              </select>
            </label>
          </div>
        </section>
      )}

      {error ? (
        <div className="inline-state">
          <Filter />
          <h2>No pudimos cargar el catálogo</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {data
            ? data.results.map((movie) => <MovieCard key={movie.id} movie={movie} />)
            : Array.from({ length: 12 }, (_, index) => <MovieCardSkeleton key={index} />)}
        </div>
      )}

      {data?.results.length === 0 && (
        <div className="inline-state">
          <Search />
          <h2>No hemos encontrado coincidencias</h2>
          <p>Prueba con otro título o elimina alguno de los filtros.</p>
        </div>
      )}
    </main>
  );
}
