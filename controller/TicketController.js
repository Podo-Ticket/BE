const { Seat, Schedule, Play } = require('../models');

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

        await Count.increment('infoCnt', { where: { id: 1 } });

        res.send({ 
            count: seats.length,
            seats: seats,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}