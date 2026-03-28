import session from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: isProduction ? 'strict' : 'lax',
  },
};

if (!sessionConfig.secret) {
  throw new Error('SESSION_SECRET must be set in environment');
}

export const sessionStore = new session.MemoryStore();
export const sessionMiddleware = session({ ...sessionConfig, store: sessionStore });
