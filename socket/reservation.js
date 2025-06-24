const { getAdminSocketIdsByPlayId } = require('./admin');

// 관리자 room에 실시간 알림 전송 함수
exports.sendOnsiteReservationAlert = function (io, playId, user) {
  if (io && playId) {
    const room = io.sockets.adapter.rooms.get(String(playId));
    const adminSocketIds = room ? Array.from(room) : [];
    const message = {
      type: 'onsite-reservation',
      name: user.name,
      headCount: user.head_count,
      phoneNumber: user.phone_number,
      scheduleId: user.schedule_id,
    };
    adminSocketIds.forEach((socketId) => {
      io.to(socketId).emit('admin:onsite-reservation', message);
    });
  }
};
