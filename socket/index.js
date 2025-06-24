const { Server } = require('socket.io');

exports.setupSocket = async (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`사용자 연결 해제: ${socket.id}`);
    });
  });

  return io;
};
