import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const onPopState = () =>
      setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const value = useMemo(
    () => ({
      location,
      navigate(to, options = {}) {
        const target = new URL(to, window.location.origin);
        window.history[options.replace ? 'replaceState' : 'pushState'](
          {},
          '',
          `${target.pathname}${target.search}${target.hash}`,
        );
        setLocation({ pathname: target.pathname, search: target.search });
        if (!options.preserveScroll) window.scrollTo({ top: 0, behavior: 'instant' });
      },
    }),
    [location],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
  return useContext(RouterContext).location;
}

export function useNavigate() {
  return useContext(RouterContext).navigate;
}

export function Link({ to, children, className, onClick, ...props }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === '_blank'
        ) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export function NavLink({ to, className = '', ...props }) {
  const { pathname } = useLocation();
  const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
  return <Link to={to} className={`${className} ${active ? 'active' : ''}`.trim()} {...props} />;
}

export function useParams() {
  const { pathname } = useLocation();
  const match = pathname.match(/^\/pelicula\/(\d+)\/?$/);
  return { id: match?.[1] };
}

export function useSearchParams() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const setParams = (value) => {
    const next = value instanceof URLSearchParams ? value : new URLSearchParams(value);
    navigate(`${location.pathname}${next.toString() ? `?${next}` : ''}`);
  };
  return [params, setParams];
}
