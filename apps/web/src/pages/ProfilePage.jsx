import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Film,
  Heart,
  LogIn,
  MessageSquareText,
  Settings,
  Star,
  UserRound,
} from 'lucide-react';
import { Link, useSearchParams } from '../lib/router';
import { useAuth } from '../context/AuthContext';
import { api, yearOf } from '../lib/api';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';

const tabs = [
  ['resumen', 'Resumen', UserRound],
  ['favoritos', 'Favoritos', Heart],
  ['pendientes', 'Mi lista', Bookmark],
  ['valoraciones', 'Valoraciones', Star],
  ['ajustes', 'Editar perfil', Settings],
];

export function ProfilePage() {
  const { user, loading, openAuth, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'resumen';
  const [dashboard, setDashboard] = useState(null);
  const [library, setLibrary] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/users/me/dashboard'),
      api.get('/library'),
      api.get('/users/me/ratings'),
    ]).then(([dashboardData, libraryData, ratingsData]) => {
      setDashboard(dashboardData);
      setLibrary(libraryData.items);
      setRatings(ratingsData.ratings);
    });
  }, [user]);

  const tabItems = useMemo(() => {
    if (currentTab === 'favoritos') return library.filter((item) => item.listType === 'favorite');
    if (currentTab === 'pendientes') return library.filter((item) => item.listType === 'watchlist');
    return [];
  }, [currentTab, library]);

  if (loading) return <main className="profile-page container"><div className="profile-loading skeleton" /></main>;

  if (!user) {
    return (
      <main className="profile-gate container">
        <span className="profile-gate-icon"><Film /></span>
        <span className="eyebrow">Tu espacio cinéfilo</span>
        <h1>Todo lo que te gusta, en un solo lugar.</h1>
        <p>Inicia sesión para crear listas, guardar favoritas, puntuar y escribir tus propias reseñas.</p>
        <button className="button button-primary" onClick={openAuth}><LogIn size={18} /> Entrar en CineWave</button>
      </main>
    );
  }

  async function saveProfile(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMessage('');
    try {
      const result = await api.patch('/users/me', {
        name: data.get('name'),
        username: data.get('username'),
        bio: data.get('bio'),
        avatarColor: data.get('avatarColor'),
      });
      updateUser(result.user);
      setMessage('Perfil actualizado');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="container profile-header">
          <span className="profile-avatar" style={{ background: user.avatarColor }}>
            {user.name[0].toUpperCase()}
          </span>
          <div>
            <span className="eyebrow">Perfil de CineWave</span>
            <h1>{user.name}</h1>
            <p>@{user.username} · Miembro desde {yearOf(user.createdAt)}</p>
            {user.bio && <blockquote>{user.bio}</blockquote>}
          </div>
        </div>
      </section>

      <div className="container profile-layout">
        <nav className="profile-tabs" aria-label="Secciones del perfil">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={currentTab === id ? 'active' : ''}
              onClick={() => setSearchParams(id === 'resumen' ? {} : { tab: id })}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <section className="profile-content">
          {currentTab === 'resumen' && (
            <>
              <div className="profile-section-heading">
                <span className="eyebrow">Tu año en películas</span>
                <h2>Así va tu historia</h2>
              </div>
              <div className="profile-stats">
                <Stat icon={Heart} value={dashboard?.stats.favorites || 0} label="favoritas" />
                <Stat icon={Bookmark} value={dashboard?.stats.watchlist || 0} label="por ver" />
                <Stat icon={Star} value={dashboard?.stats.ratings || 0} label="valoradas" />
                <Stat icon={MessageSquareText} value={dashboard?.stats.reviews || 0} label="reseñas" />
              </div>
              <div className="activity-panel">
                <h3>Actividad reciente</h3>
                {dashboard?.activity.length ? (
                  <div className="activity-list">
                    {dashboard.activity.map((item, index) => (
                      <Link key={`${item.type}-${item.movie?.id}-${index}`} to={`/pelicula/${item.movie?.id}`}>
                        <span className={`activity-icon ${item.type}`}>
                          {item.type === 'rating' ? <Star /> : item.type === 'review' ? <MessageSquareText /> : item.type === 'favorite' ? <Heart /> : <Bookmark />}
                        </span>
                        <span>
                          <strong>{item.movie?.title}</strong>
                          <small>{activityCopy(item)}</small>
                        </span>
                        <time>{new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
                          Math.max(-365, Math.round((new Date(`${item.createdAt}Z`) - Date.now()) / 86400000)),
                          'day',
                        )}</time>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyLibrary title="Tu historia empieza con una película" copy="Explora el catálogo y guarda algo que te apetezca ver." />
                )}
              </div>
            </>
          )}

          {(currentTab === 'favoritos' || currentTab === 'pendientes') && (
            <>
              <div className="profile-section-heading">
                <span className="eyebrow">{currentTab === 'favoritos' ? 'Las que llevas contigo' : 'Próximas historias'}</span>
                <h2>{currentTab === 'favoritos' ? 'Tus películas favoritas' : 'Tu lista para ver'}</h2>
              </div>
              {dashboard ? (
                tabItems.length ? (
                  <div className="profile-movie-grid">
                    {tabItems.map((item) => <MovieCard key={item.id} movie={item.movie} />)}
                  </div>
                ) : (
                  <EmptyLibrary
                    title={currentTab === 'favoritos' ? 'Aún no tienes favoritas' : 'Tu lista está esperando'}
                    copy="Cuando encuentres una película, usa el corazón o el botón «Añadir a mi lista»."
                  />
                )
              ) : (
                <div className="profile-movie-grid">{Array.from({ length: 4 }, (_, index) => <MovieCardSkeleton key={index} />)}</div>
              )}
            </>
          )}

          {currentTab === 'valoraciones' && (
            <>
              <div className="profile-section-heading">
                <span className="eyebrow">Tu criterio</span>
                <h2>Películas que has puntuado</h2>
              </div>
              {ratings.length ? (
                <div className="ratings-list">
                  {ratings.map((rating) => (
                    <Link key={rating.id} to={`/pelicula/${rating.movieId}`}>
                      <div><strong>{rating.movie.title}</strong><small>{yearOf(rating.movie.release_date)}</small></div>
                      <span><Star size={18} fill="currentColor" /> {rating.score}/10</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyLibrary title="Todavía no has puntuado ninguna" copy="Tus valoraciones aparecerán aquí y ayudarán a personalizar tu experiencia." />
              )}
            </>
          )}

          {currentTab === 'ajustes' && (
            <>
              <div className="profile-section-heading">
                <span className="eyebrow">Hazlo tuyo</span>
                <h2>Editar perfil</h2>
              </div>
              <form className="settings-form" onSubmit={saveProfile}>
                <div className="field-row">
                  <label>Nombre<input name="name" defaultValue={user.name} required /></label>
                  <label>Usuario<input name="username" defaultValue={user.username} required /></label>
                </div>
                <label>Tu bio<textarea name="bio" rows="4" maxLength="280" defaultValue={user.bio} placeholder="Cuéntanos qué cine te mueve..." /></label>
                <fieldset>
                  <legend>Color del avatar</legend>
                  <div className="color-options">
                    {['#2176ff', '#7657ff', '#00a6a6', '#ef476f', '#f59e0b', '#10b981'].map((color) => (
                      <label key={color} style={{ background: color }}>
                        <input type="radio" name="avatarColor" value={color} defaultChecked={user.avatarColor === color} />
                        <span />
                      </label>
                    ))}
                  </div>
                </fieldset>
                {message && <p className="settings-message">{message}</p>}
                <button className="button button-primary">Guardar cambios</button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, value, label }) {
  return <div><Icon /><strong>{value}</strong><span>{label}</span></div>;
}

function EmptyLibrary({ title, copy }) {
  return (
    <div className="empty-library">
      <Film />
      <h3>{title}</h3>
      <p>{copy}</p>
      <Link className="button button-outline" to="/descubrir">Explorar películas</Link>
    </div>
  );
}

function activityCopy(item) {
  if (item.type === 'rating') return `Puntuaste con ${item.value}/10`;
  if (item.type === 'review') return `Publicaste «${item.value}»`;
  if (item.type === 'favorite') return 'La añadiste a favoritas';
  return 'La añadiste a tu lista';
}
