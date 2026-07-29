import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { MoviePage } from './pages/MoviePage';
import { ProfilePage } from './pages/ProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { useLocation } from './lib/router';

export function App() {
  const { pathname } = useLocation();
  let page = <HomePage />;
  if (pathname === '/descubrir') page = <DiscoverPage />;
  else if (pathname === '/buscar') page = <DiscoverPage searchMode />;
  else if (/^\/pelicula\/\d+\/?$/.test(pathname)) page = <MoviePage />;
  else if (pathname === '/perfil') page = <ProfilePage />;
  else if (pathname === '/comunidad') page = <CommunityPage />;

  return (
    <div className="app-shell">
      <Header />
      {page}
      <Footer />
      <AuthModal />
    </div>
  );
}
