import { Star } from 'lucide-react';
import { useState } from 'react';

export function RatingPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(null);
  const active = hover || value || 0;
  return (
    <div className="rating-picker" onMouseLeave={() => setHover(null)}>
      <div className="rating-picker-stars">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHover(score)}
            onFocus={() => setHover(score)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(score)}
            aria-label={`Puntuar con ${score} sobre 10`}
            className={score <= active ? 'active' : ''}
          >
            <Star size={24} fill={score <= active ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <strong>{active ? `${active}/10` : 'Tu puntuación'}</strong>
    </div>
  );
}
