const session = require('express-session');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
    name: 'session_ID',
    httpOnly: true,
    maxAge: 90 * 60 * 1000,
  },
});

module.exports = sessionMiddleware;
