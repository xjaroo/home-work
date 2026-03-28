import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { productionCorsOrigin } from './lib/productionCors.js';
import { sessionMiddleware } from './session.js';
import authRoutes from './routes/auth.routes.js';
import familiesRoutes from './routes/families.routes.js';
import inviteRoutes from './routes/invite.routes.js';
import { createTasksRouter } from './routes/tasks.routes.js';
import { createMoneyRouter } from './routes/money.routes.js';
import { createKidsRouter } from './routes/kids.routes.js';
import { createMessagesRouter } from './routes/messages.routes.js';
import { createParentChatRouter } from './routes/parentChat.routes.js';
import { createNotificationsRouter } from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: isProduction ? 'same-origin' : 'cross-origin' },
}));

app.use(cors({
  origin: isProduction ? productionCorsOrigin() : true,
  credentials: true,
}));

app.use(express.json());
app.use(sessionMiddleware);

let _io = null;
export function setIo(io) {
  _io = io;
}
function getIo() {
  return _io;
}

app.use('/auth', authRoutes);
app.use('/families', familiesRoutes);
app.use('/parents', inviteRoutes);
app.use('/invite', inviteRoutes);
app.use('/tasks', createTasksRouter(getIo));
app.use('/money', createMoneyRouter(getIo));
app.use('/kids', createKidsRouter());
app.use('/messages', createMessagesRouter(getIo));
app.use('/parent-chat', createParentChatRouter(getIo));
app.use('/notifications', createNotificationsRouter());

// SPA routes under /admin/* — full page loads must get index.html, not JSON API
if (isProduction) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.path.startsWith('/admin')) return next();
    if (!(req.headers.accept || '').includes('text/html')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use('/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

if (isProduction) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 404 + errorHandler are registered in server.js after Vite middleware (dev).

export default app;
export { errorHandler } from './middleware/errorHandler.js';
