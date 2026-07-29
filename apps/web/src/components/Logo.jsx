import { Link } from '../lib/router';

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="CineWave, inicio">
      <span className="logo-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>CineWave</span>
    </Link>
  );
}
