const { Seat, Schedule, Play, Count, Survey } = require('../models');

// 티켓 정보
exports.showTicketInfo = async (req, res) => {
    try {
        const { id } = req.session.userInfo;

        const seats = await Seat.findAll({
            attributes: [ 'row', 'number'],
            where: { user_id: id },
            include: {
                model: Schedule,
                attributes: ['date_time'],
                include: {
                    model: Play,
                    attributes: ['title', 'poster'],
                }
            }
        });

        const isSurvey = await Survey.findOne({
            where: { user_id: id }
        });

        await Count.increment('infoCnt', { where: { id: 1 } });

        res.send({ 
            count: seats.length,
            seats: seats,
            isSurvey: (isSurvey) ? true : false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}