const { Server } = require('socket.io');
const sharedSession = require('express-socket.io-session');
const sessionMiddleware = require('../utils/session');
const { joinAdminRoom } = require('./admin');

exports.setupSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(sharedSession(sessionMiddleware, { autoSave: true }));

  app.set('io', io);

  io.on('connection', (socket) => {
    const session = socket.handshake.session;
    if (session && session.admin && session.admin.play) {
      joinAdminRoom({
        req: { session },
        io,
        socketId: socket.id,
        playId: session.admin.play,
      });
    }
    console.log(`사용자 연결됨: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`사용자 연결 해제: ${socket.id}`);
    });
  });

  return io;
};
