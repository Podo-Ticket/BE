const adminRoomMap = new Map(); // play_id -> Set(socketId)

exports.joinAdminRoom = ({ req, socketId, playId }) => {
  const io = req.app.get('io');
  if (socketId && io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      // 기존에 다른 playId room에 속해 있다면 제거
      for (const [pid, socketSet] of adminRoomMap.entries()) {
        if (pid !== playId && socketSet.has(socketId)) {
          socket.leave(String(pid));
          socketSet.delete(socketId);
          console.log(`관리자 소켓 ${socketId}가 기존 room ${pid}에서 제거됨`);
        }
      }
      // 새 playId room에 join
      socket.join(String(playId));
      if (!adminRoomMap.has(playId)) {
        adminRoomMap.set(playId, new Set());
      }
      adminRoomMap.get(playId).add(socketId);
      console.log(`관리자 소켓 ${socketId}가 room ${playId}에 join됨`);
    }
  }
};

// 필요시: 특정 playId의 모든 관리자 소켓ID 반환
exports.getAdminSocketIdsByPlayId = (playId) => {
  return Array.from(adminRoomMap.get(playId) || []);
};
