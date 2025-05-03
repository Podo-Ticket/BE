const { Seat, Schedule, Play, Count, Survey, OnSite } = require('../models');

// 티켓 정보
exports.showTicketInfo = async (req, res) => {
  try {
    const { id } = req.session.userInfo;

    const [seats, isOnSite, isSurvey] = await Promise.all([
      Seat.findAll({
        attributes: ['row', 'number'],
        where: { user_id: id },
        include: {
          model: Schedule,
          attributes: ['date_time'],
          include: {
            model: Play,
            attributes: [
              'title',
              'poster',
              'location',
              'running_time',
              'en_title',
              'en_location',
            ],
          },
        },
      }),
      OnSite.findOne({
        where: { user_id: id },
      }),
      Survey.findOne({
        where: { user_id: id },
      }),
    ]);

    // await Count.increment('infoCnt', { where: { id: 1 } });

    res.send({
      count: seats.length,
      onSite: Boolean(isOnSite),
      seats: seats,
      isSurvey: Boolean(isSurvey),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
