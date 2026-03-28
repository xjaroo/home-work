import session from 'express-session';

// One server, one port: session cookie must be sent on http:// (e.g. PM2 on :3001).
// Use SESSION_COOKIE_SECURE=true only when users use HTTPS (reverse proxy TLS).
const cookieSecure = process.env.SESSION_COOKIE_SECURE === 'true';

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: cookieSecure,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: cookieSecure ? 'strict' : 'lax',
  },
};

if (!sessionConfig.secret) {
  throw new Error('SESSION_SECRET must be set in environment');
}

export const sessionStore = new session.MemoryStore();
export const sessionMiddleware = session({ ...sessionConfig, store: sessionStore });
