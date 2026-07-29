const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { config } = require('./config');

let database;

function createDatabase(filename = config.databasePath) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_color TEXT NOT NULL DEFAULT '#2176ff',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      list_type TEXT NOT NULL CHECK(list_type IN ('favorite', 'watchlist')),
      movie_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id, list_type),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      score REAL NOT NULL CHECK(score >= 0.5 AND score <= 10),
      movie_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      contains_spoilers INTEGER NOT NULL DEFAULT 0,
      movie_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, movie_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_likes (
      user_id INTEGER NOT NULL,
      review_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, review_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_list_items_user_type
      ON list_items(user_id, list_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_movie
      ON reviews(movie_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ratings_movie
      ON ratings(movie_id);
  `);

  return db;
}

function getDb() {
  if (!database) database = createDatabase();
  return database;
}

function setDb(db) {
  if (database && database !== db) database.close();
  database = db;
}

function closeDb() {
  if (database) database.close();
  database = undefined;
}

module.exports = { createDatabase, getDb, setDb, closeDb };
