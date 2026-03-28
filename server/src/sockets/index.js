import { parse } from 'cookie';
import cookieSignature from 'cookie-signature';
import { sessionStore } from '../session.js';
import * as users from '../db/queries/users.js';

export function attachSocketAuth(io) {
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('No cookie'));
    }
    const cookies = parse(cookieHeader);
    const sidCookie = cookies['connect.sid'];
    if (!sidCookie) {
      return next(new Error('No session'));
    }
    const raw = sidCookie.startsWith('s:') ? sidCookie.slice(2) : sidCookie;
    const sessionId = cookieSignature.unsign(raw, process.env.SESSION_SECRET) || (raw.includes('.') ? false : raw);
    if (!sessionId) {
      return next(new Error('Invalid session'));
    }
    sessionStore.get(sessionId, (err, sess) => {
      if (err || !sess || !sess.userId) {
        return next(new Error('Unauthorized'));
      }
      const user = users.getById(sess.userId);
      if (!user) {
        return next(new Error('Unauthorized'));
      }
      socket.userId = user.id;
      socket.familyId = user.family_id;
      next();
    });
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.join(`family:${socket.familyId}`);
  });
}
