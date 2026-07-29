const { createApp } = require('./app');
const { config } = require('./config');
const { getDb, closeDb } = require('./db');

getDb();
const server = createApp().listen(config.port, '0.0.0.0', () => {
  console.log(`CineWave API disponible en http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
