import { Github, Heart } from 'lucide-react';
import { Link } from '../lib/router';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>Tu universo de cine. Descubre, puntúa y comparte las historias que te mueven.</p>
        </div>
        <div>
          <strong>Explora</strong>
          <Link to="/descubrir">Películas</Link>
          <Link to="/descubrir?sortBy=popularity.desc">Tendencias</Link>
          <Link to="/comunidad">Comunidad</Link>
        </div>
        <div>
          <strong>Tu espacio</strong>
          <Link to="/perfil">Perfil</Link>
          <Link to="/perfil?tab=favoritos">Favoritos</Link>
          <Link to="/perfil?tab=pendientes">Mi lista</Link>
        </div>
        <div className="footer-note">
          <span>Datos de catálogo proporcionados por TMDB.</span>
          <a href="https://github.com/" aria-label="GitHub"><Github /></a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} CineWave</span>
        <span>Hecho con <Heart size={14} fill="currentColor" /> para quienes viven el cine.</span>
      </div>
    </footer>
  );
}
