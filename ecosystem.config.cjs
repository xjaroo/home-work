/**
 * PM2: one Node process, one public PORT (e.g. 3001).
 * Serves: REST API + Socket.IO + static React app from client/dist (run `pnpm run build:client` first).
 *
 * server/.env:
 *   SESSION_SECRET      — required (long random string). PM2 fails fast if missing.
 *   PORT=3001           — only port to open on the firewall
 *   FRONTEND_ORIGIN     — optional; comma-separated if you want a strict allowlist.
 *                         If unset, CORS/Socket.IO reflect the browser Origin (typical single-host PM2).
 *
 * NODE_ENV=production is set below so Express serves client/dist on the same PORT as the API.
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('./server/node_modules/dotenv');

const envPath = path.join(__dirname, 'server', '.env');
const envFromFile = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath, 'utf8'))
  : {};

const env = {
  ...envFromFile,
  NODE_ENV: 'production',
};

const sessionSecret = String(env.SESSION_SECRET || process.env.SESSION_SECRET || '').trim();
if (!sessionSecret) {
  console.error(
    '[ecosystem.config.cjs] SESSION_SECRET is missing. Set it in server/.env (see server/.env.example), e.g. a long random string, then run: pm2 restart home-work --update-env'
  );
  process.exit(1);
}
env.SESSION_SECRET = sessionSecret;

module.exports = {
  apps: [
    {
      name: 'home-work',
      cwd: path.join(__dirname, 'server'),
      script: 'src/server.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env,
    },
  ],
};
