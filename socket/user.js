const userSocketMap = new Map();
const sessionSocketMap = new Map();

exports.handleLogin = ({ req, userId, sessionId, socketId }) => {
  const io = req.app.get('io');

  // 공통 로그아웃 처리 함수
  const forceLogoutBySocketId = (socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('forceLogout', {
        message: '동시 접속이 확인되었습니다.',
      });
    }
  };

  // 1. 동일 브라우저 세션 중복 로그인
  const prevSessionSocketId = sessionSocketMap.get(sessionId);
  if (prevSessionSocketId && prevSessionSocketId !== socketId) {
    forceLogoutBySocketId(prevSessionSocketId);
    sessionSocketMap.delete(sessionId);
  }

  // 2. 동일 유저 중복 로그인
  const prevSocketId = userSocketMap.get(userId);
  if (prevSocketId && prevSocketId !== socketId) {
    forceLogoutBySocketId(prevSocketId);
  }

  sessionSocketMap.set(sessionId, socketId);
  userSocketMap.set(userId, socketId);
};
