import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createServer as createViteServer, loadConfigFromFile, mergeConfig } from 'vite';

import app, { errorHandler, setIo } from './app.js';
import { productionCorsOrigin } from './lib/productionCors.js';
import { attachSocketAuth } from './sockets/index.js';
import { initDb } from './db/sqlite.js';
import { migrate } from './db/migrate.js';
import { syncEnvAdmins } from './bootstrap/envAdmins.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, '..', '..', 'client');
const clientDist = path.join(clientRoot, 'dist');

const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const socketCorsOrigin = isProduction ? productionCorsOrigin() : null;

async function start() {
  await initDb();
  await migrate();
  syncEnvAdmins();

  if (isProduction && !fs.existsSync(path.join(clientDist, 'index.html'))) {
    console.error(
      'Production mode requires a built client. From repo root run: pnpm run build:client'
    );
    process.exit(1);
  }

  const httpServer = http.createServer(app);

  let vite;
  if (!isProduction) {
    const loaded = await loadConfigFromFile(
      { command: 'serve', mode: 'development' },
      path.join(clientRoot, 'vite.config.js')
    );
    vite = await createViteServer(
      mergeConfig(loaded.config, {
        root: clientRoot,
        server: {
          middlewareMode: true,
          hmr: { server: httpServer },
        },
        appType: 'spa',
      })
    );
    app.use(vite.middlewares);
  }

  app.use((_req, _res, next) => {
    next(Object.assign(new Error('Not found'), { status: 404 }));
  });
  app.use(errorHandler);

  const io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigin ?? ((origin, callback) => callback(null, origin || true)),
      credentials: true,
    },
  });

  attachSocketAuth(io);
  setIo(io);

  const listenHost = process.env.LISTEN_HOST || '0.0.0.0';
  httpServer.listen(port, listenHost, () => {
    if (isProduction) {
      console.log(`Server listening on ${listenHost}:${port}`);
    } else {
      console.log(`Dev: API + Vite on port ${port} (bind ${listenHost}) — use this single port in the browser and on your firewall`);
    }
  });

  return { httpServer, vite };
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
