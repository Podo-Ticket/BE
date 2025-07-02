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

exports.sendProcessOnsiteRequestAlert = function (
  io,
  playId,
  userIds,
  scheduleId
) {
  if (io && playId) {
    const room = io.sockets.adapter.rooms.get(String(playId));
    const adminSocketIds = room ? Array.from(room) : [];
    const message = {
      type: 'process_onsite_request',
      userIds: userIds,
      scheduleId: scheduleId,
      message: '현장 예매 요청 처리가 완료되었습니다.',
    };
    adminSocketIds.forEach((socketId) => {
      io.to(socketId).emit('admin:process-onsite-request', message);
    });
  }
};

exports.sendNoRequestsMessage = function (io, playId) {
  if (io && playId) {
    const room = io.sockets.adapter.rooms.get(String(playId));
    const adminSocketIds = room ? Array.from(room) : [];
    const message = {
      type: 'no_requests',
      message: '현재 처리할 현장 예매 요청이 없습니다.',
    };
    adminSocketIds.forEach((socketId) => {
      io.to(socketId).emit('admin:no-onsite-requests', message);
    });
  }
};
