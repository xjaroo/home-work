import http from 'http';
import { Server } from 'socket.io';
import app, { setIo } from './app.js';
import { attachSocketAuth } from './sockets/index.js';
import { initDb } from './db/sqlite.js';
import { migrate } from './db/migrate.js';
import { syncEnvAdmins } from './bootstrap/envAdmins.js';

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const frontendOrigins = isProduction
  ? (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim())
  : null;

async function start() {
  await initDb();
  await migrate();
  syncEnvAdmins();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: frontendOrigins
        ? frontendOrigins
        : (origin, callback) => callback(null, origin || true),
      credentials: true,
    },
  });

  attachSocketAuth(io);
  setIo(io);

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  return server;
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
