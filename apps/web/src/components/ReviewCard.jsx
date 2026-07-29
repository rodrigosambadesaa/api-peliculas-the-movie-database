import { Heart, MessageCircle, Star } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function ReviewCard({ review }) {
  const { requireUser } = useAuth();
  const [liked, setLiked] = useState(review.liked);
  const [likes, setLikes] = useState(review.likeCount);
  const [spoilerOpen, setSpoilerOpen] = useState(false);

  async function toggleLike() {
    requireUser(async () => {
      const next = !liked;
      setLiked(next);
      setLikes((value) => value + (next ? 1 : -1));
      try {
        if (next) await api.put(`/reviews/${review.id}/like`);
        else await api.delete(`/reviews/${review.id}/like`);
      } catch {
        setLiked(!next);
        setLikes((value) => value + (next ? -1 : 1));
      }
    });
  }

  return (
    <article className="review-card">
      <header>
        <span className="review-avatar" style={{ background: review.avatarColor }}>
          {review.userName[0].toUpperCase()}
        </span>
        <div>
          <strong>{review.userName}</strong>
          <small>
            @{review.username} ·{' '}
            {new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
              new Date(`${review.createdAt}Z`),
            )}
          </small>
        </div>
        {review.rating && (
          <span className="review-rating">
            <Star size={15} fill="currentColor" /> {review.rating}
          </span>
        )}
      </header>
      <h3>{review.title}</h3>
      {review.containsSpoilers && !spoilerOpen ? (
        <button className="spoiler-cover" onClick={() => setSpoilerOpen(true)}>
          Esta reseña contiene spoilers · Mostrar
        </button>
      ) : (
        <p>{review.content}</p>
      )}
      <footer>
        <button className={liked ? 'liked' : ''} onClick={toggleLike}>
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} /> {likes} útiles
        </button>
        <span>
          <MessageCircle size={17} /> Reseña
        </span>
      </footer>
    </article>
  );
}
