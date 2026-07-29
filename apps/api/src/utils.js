function movieSnapshot(input) {
  return JSON.stringify({
    id: Number(input.id),
    title: String(input.title || 'Película'),
    poster_path: input.poster_path || null,
    release_date: input.release_date || '',
    vote_average: Number(input.vote_average || 0),
  });
}

function parseSnapshot(row) {
  try {
    return { ...row, movie: JSON.parse(row.movie_snapshot) };
  } catch {
    return { ...row, movie: null };
  }
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarColor: user.avatarColor || user.avatar_color,
    createdAt: user.createdAt || user.created_at,
  };
}

module.exports = { movieSnapshot, parseSnapshot, publicUser };
