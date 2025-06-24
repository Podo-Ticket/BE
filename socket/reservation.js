const { getAdminSocketIdsByPlayId } = require('./admin');

// 관리자 room에 실시간 알림 전송 함수
exports.sendOnsiteReservationAlert = ({ req, playId, user }) => {
  const io = req.app.get('io');
  if (io && playId) {
    const adminSocketIds = getAdminSocketIdsByPlayId(playId);
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
