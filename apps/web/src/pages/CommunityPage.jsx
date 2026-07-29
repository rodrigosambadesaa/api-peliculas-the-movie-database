import { useEffect, useState } from 'react';
import { ArrowRight, MessageSquareText, Sparkles, Star, Users } from 'lucide-react';
import { Link } from '../lib/router';
import { api, imageUrl } from '../lib/api';
import { ReviewCard } from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';

export function CommunityPage() {
  const [data, setData] = useState(null);
  const { user, openAuth } = useAuth();

  useEffect(() => {
    api.get('/reviews/latest').then(setData);
  }, []);

  return (
    <main className="community-page">
      <section className="community-hero">
        <div className="container">
          <span className="eyebrow"><Sparkles size={15} /> Comunidad CineWave</span>
          <h1>El cine termina.<br />La conversación empieza.</h1>
          <p>Descubre qué está emocionando a otros cinéfilos, comparte tu mirada y encuentra personas con tu mismo pulso.</p>
          {!user && <button className="button button-light" onClick={openAuth}>Únete a la conversación <ArrowRight size={18} /></button>}
        </div>
      </section>

      <section className="community-body container">
        <div className="community-feed">
          <div className="section-heading">
            <div><span className="eyebrow">Recién publicadas</span><h2>Opiniones que merece la pena leer</h2></div>
          </div>
          {data?.reviews?.length ? (
            data.reviews.map((review) => (
              <div className="community-review" key={review.id}>
                {review.movie?.poster_path && (
                  <Link to={`/pelicula/${review.movie.id}`}>
                    <img src={imageUrl(review.movie.poster_path, 'w185')} alt="" />
                    <span>{review.movie.title}</span>
                  </Link>
                )}
                <ReviewCard review={review} />
              </div>
            ))
          ) : (
            <div className="empty-reviews community-empty">
              <MessageSquareText />
              <h3>La conversación está a punto de empezar</h3>
              <p>Explora una película y publica la primera reseña de la comunidad.</p>
              <Link className="button button-primary" to="/descubrir">Encontrar una película</Link>
            </div>
          )}
        </div>
        <aside className="community-sidebar">
          <span className="eyebrow">En números</span>
          <h3>Una comunidad que crece contigo</h3>
          <div className="community-number"><Users /><strong>{data?.stats.members || 0}</strong><span>miembros</span></div>
          <div className="community-number"><MessageSquareText /><strong>{data?.stats.reviews || 0}</strong><span>reseñas</span></div>
          <div className="community-number"><Star /><strong>{data?.stats.ratings || 0}</strong><span>valoraciones</span></div>
          <div className="community-code">
            <span>Código de la comunidad</span>
            <p>Sé honesto. Evita spoilers. Discrepa con respeto. Y, sobre todo, disfruta del cine.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
