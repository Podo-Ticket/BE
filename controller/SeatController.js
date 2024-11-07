const {Seat} = require('../models');

// 좌석 화면 - 예약된 좌석만 전달
exports.showSeats = async (req, res) => {
    try {
        const { playId } = req.query;

        if(!playId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 ID"
            });
        }

        const seats = await Seat.findAll({
            where: {
                play_id: playId
            }
        });

        res.send({ seats: seats });
    } catch (err) {
        res.status(500).send("Internal server error");
    }
}

// 좌석 선택 - 이미 예약된 좌석이 있는지 확인