# CineWave

[![CI](https://github.com/rodrigosambadesaa/api-peliculas-the-movie-database/actions/workflows/ci.yml/badge.svg)](https://github.com/rodrigosambadesaa/api-peliculas-the-movie-database/actions/workflows/ci.yml)

Una plataforma social de cine inspirada en la experiencia de IMDb: catálogo, búsqueda,
filtros, fichas completas, perfiles, valoraciones, reseñas, favoritos y listas para ver.
El proyecto original de un solo endpoint se ha convertido en una aplicación web completa,
segura y dockerizada.

![Vista previa de CineWave](apps/web/public/og.png)

## Funciones

- Inicio editorial con tendencias, mejor valoradas, próximos estrenos y géneros.
- Búsqueda de películas y explorador con filtros de género, año, nota y orden.
- Fichas con sinopsis, reparto, dirección, duración, tráiler, recomendaciones y datos técnicos.
- Registro, inicio de sesión y sesión persistente mediante cookie segura.
- Perfil editable, estadísticas y cronología de actividad.
- Favoritos y lista personal para ver.
- Valoraciones del 1 al 10 y puntuación agregada de la comunidad.
- Reseñas con aviso de spoilers y votos de utilidad.
- Comunidad con las últimas reseñas.
- API REST con validación, límites de peticiones, caché de TMDB y errores normalizados.
- Modo demo automático cuando no se configura una credencial de TMDB.
- Contenedores separados para API y web, proxy inverso y volumen persistente.
- CI para ejecutar tests, compilar la web y validar Docker Compose en cada pull request.
- Actualizaciones automáticas de dependencias mediante Dependabot.

## Puesta en marcha con Docker

1. Copia `.env.example` como `.env`.
2. Genera un `JWT_SECRET` aleatorio de **32 caracteres como mínimo** y añádelo a `.env`.
   Por ejemplo, con OpenSSL:

   ```bash
   openssl rand -hex 32
   ```

3. Opcionalmente, añade `TMDB_READ_TOKEN` para usar el catálogo completo. Puedes obtener el
   token en la configuración de API de tu cuenta de TMDB.
4. Arranca la aplicación:

   ```bash
   docker compose up --build
   ```

5. Abre [http://localhost:8088](http://localhost:8088).

Docker se negará a arrancar la API en modo producción si `JWT_SECRET` está vacío o no alcanza
la longitud mínima. Sin credenciales de TMDB la aplicación arranca igualmente con un catálogo
de demostración. Los usuarios, listas, valoraciones y reseñas se guardan en el volumen
`cinewave_data`.

Para detener la aplicación:

```bash
docker compose down
```

`docker compose down -v` también elimina los datos persistidos.

## Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Los comandos principales son:

```bash
npm run build
npm test
npm start
```

Antes de abrir un pull request es recomendable ejecutar al menos `npm test` y `npm run build`.
El workflow de GitHub Actions repite esas comprobaciones con una instalación limpia mediante
`npm ci` y valida además `compose.yaml`.

## API

Los endpoints principales están bajo `/api`:

| Área | Endpoints |
|---|---|
| Catálogo | `GET /movies/home`, `/movies/search`, `/movies/discover`, `/movies/:id` |
| Cuenta | `POST /auth/register`, `/auth/login`, `/auth/logout`, `GET /auth/me` |
| Biblioteca | `GET /library`, `PUT/DELETE /library/:type/:movieId` |
| Valoraciones | `PUT/DELETE /ratings/:movieId` |
| Reseñas | `GET /reviews/latest`, `/reviews/movie/:movieId`, operaciones de creación y voto |
| Perfil | `GET /users/me/dashboard`, `/users/me/ratings`, `PATCH /users/me` |

El endpoint original `GET /busqueda?name=...` se conserva por compatibilidad, ahora con
validación y manejo de resultados vacíos.

## Estructura

```text
.github/        CI y actualización automática de dependencias
apps/
  api/          API Express y base de datos SQLite
  web/          React, Vite y estilos de la interfaz
compose.yaml    Orquestación de los contenedores
Dockerfile.api
Dockerfile.web
```

## Seguridad

La credencial de TMDB no está incluida en el código. Las contraseñas se almacenan con hash
bcrypt, las sesiones expiran, los datos se validan en el servidor y se aplican cabeceras
seguras y límites de peticiones.

En producción:

- `JWT_SECRET` es obligatorio y debe tener al menos 32 caracteres.
- Usa HTTPS y configura `COOKIE_SECURE=true`.
- Configura `WEB_ORIGIN` únicamente con los orígenes web autorizados; admite varios separados
  por comas.
- Solo habilita `TRUST_PROXY` cuando la API esté realmente detrás de un proxy de confianza.
  El `compose.yaml` incluido usa un salto porque Nginx es el único proxy entre el cliente y
  Express; esto permite que el rate limiting use la IP real del cliente.
- Mantén una política de copias de seguridad para el volumen persistente.

Nginx añade cabeceras defensivas a la aplicación web y reenvía `X-Forwarded-For` y
`X-Forwarded-Proto` a la API. Los intentos de login y registro están limitados de forma
independiente del resto de endpoints de autenticación.

Los datos cinematográficos y las imágenes pertenecen a TMDB. Este producto usa la API de
TMDB, pero no está respaldado ni certificado por TMDB.
