// playId별 관리자 소켓ID 목록을 socket.io의 room 시스템에서 직접 조회
exports.getAdminSocketIdsByPlayId = function (io, playId) {
  const room = io.sockets.adapter.rooms.get(String(playId));
  return room ? Array.from(room) : [];
};

// 관리자 소켓을 playId room에 join시키는 함수 (기존 room에서 leave도 포함)
exports.joinAdminRoom = function ({ req, io, socketId, playId }) {
  // req에 admin이 있을 때만 room join
  if (req && req.session && req.session.admin && socketId && io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      // 현재 소켓이 속한 모든 room 중, playId와 다른 room이 있으면 leave
      socket.rooms.forEach((room) => {
        if (room !== socket.id && room !== String(playId)) {
          socket.leave(room);
          console.log(
            `관리자 소켓 ${socketId}가 기존 room ${room}에서 leave됨`
          );
        }
      });
      // 항상 playId room에 join (중복 join 안전)
      socket.join(String(playId));
      console.log(`관리자 소켓 ${socketId}가 room ${playId}에 join됨`);
    }
  }
};
