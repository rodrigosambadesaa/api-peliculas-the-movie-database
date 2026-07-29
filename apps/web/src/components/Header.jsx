import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from '../lib/router';
import { Bookmark, Heart, LogOut, Menu, Search, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function Header() {
  const { user, openAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function close(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function submit(event) {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className={`primary-nav ${mobileOpen ? 'is-open' : ''}`} aria-label="Principal">
          <NavLink to="/" onClick={() => setMobileOpen(false)}>
            Inicio
          </NavLink>
          <NavLink to="/descubrir" onClick={() => setMobileOpen(false)}>
            Explorar
          </NavLink>
          <NavLink to="/comunidad" onClick={() => setMobileOpen(false)}>
            Comunidad
          </NavLink>
        </nav>

        <form className="header-search" onSubmit={submit} role="search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar películas..."
            aria-label="Buscar películas"
          />
          <kbd>↵</kbd>
        </form>

        <div className="header-actions">
          {user ? (
            <div className="profile-menu" ref={profileRef}>
              <button
                className="avatar-button"
                onClick={() => setProfileOpen((value) => !value)}
                aria-expanded={profileOpen}
                aria-label="Abrir menú de perfil"
              >
                <span style={{ background: user.avatarColor }}>{user.name[0].toUpperCase()}</span>
                <span className="avatar-copy">
                  <small>Mi espacio</small>
                  {user.name.split(' ')[0]}
                </span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-user">
                    <span style={{ background: user.avatarColor }}>{user.name[0].toUpperCase()}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>@{user.username}</small>
                    </div>
                  </div>
                  <Link to="/perfil" onClick={() => setProfileOpen(false)}>
                    <UserRound size={17} /> Mi perfil
                  </Link>
                  <Link to="/perfil?tab=favoritos" onClick={() => setProfileOpen(false)}>
                    <Heart size={17} /> Favoritos
                  </Link>
                  <Link to="/perfil?tab=pendientes" onClick={() => setProfileOpen(false)}>
                    <Bookmark size={17} /> Mi lista
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setProfileOpen(false);
                      navigate('/');
                    }}
                  >
                    <LogOut size={17} /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="button button-small button-ghost" onClick={openAuth}>
              Entrar
            </button>
          )}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
