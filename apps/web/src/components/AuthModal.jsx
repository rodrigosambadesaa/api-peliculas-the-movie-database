import { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function AuthModal() {
  const { authOpen, closeAuth, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!authOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') closeAuth();
    }
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      if (mode === 'login') {
        await login({ identity: data.get('identity'), password: data.get('password') });
      } else {
        await register({
          name: data.get('name'),
          username: data.get('username'),
          email: data.get('email'),
          password: data.get('password'),
        });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeAuth()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={closeAuth} aria-label="Cerrar">
          <X />
        </button>
        <Logo />
        <div className="auth-heading">
          <span className="eyebrow">{mode === 'login' ? 'Nos alegra verte' : 'Únete a la comunidad'}</span>
          <h2 id="auth-title">{mode === 'login' ? 'Vuelve a tu universo' : 'Crea tu espacio cinéfilo'}</h2>
          <p>
            {mode === 'login'
              ? 'Continúa donde lo dejaste: listas, reseñas y mucho cine.'
              : 'Guarda películas, puntúa y comparte lo que te hace sentir cada historia.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="field-row">
              <label>
                Nombre
                <input name="name" required minLength="2" placeholder="Alex García" />
              </label>
              <label>
                Usuario
                <input name="username" required minLength="3" placeholder="alexcine" />
              </label>
            </div>
          )}
          <label>
            {mode === 'login' ? 'Email o usuario' : 'Email'}
            <input
              name={mode === 'login' ? 'identity' : 'email'}
              type={mode === 'login' ? 'text' : 'email'}
              autoComplete={mode === 'login' ? 'username' : 'email'}
              required
              placeholder={mode === 'login' ? 'tu@email.com' : 'alex@email.com'}
            />
          </label>
          <label>
            Contraseña
            <span className="password-field">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary button-wide" disabled={pending}>
            {pending ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </section>
    </div>
  );
}
