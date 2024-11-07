const { Seat } = require('../models');
const Op = require('sequelize').Op;

// 좌석 화면 - 예약된 좌석만 전달
exports.showSeats = async (req, res) => {
    try {
        const { scheduleId } = req.query;

        if(!scheduleId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID"
            });
        }

        const seats = await Seat.findAll({
            where: {
                schedule_id: scheduleId
            }
        });

        res.send({ seats: seats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 좌석 선택 - 이미 예약된 좌석이 있는지 확인
exports.checkReserved = async (req, res) => {
    try {
        const { scheduleId, seats } = req.query; // seats는 { row, number } 형태의 객체 - 인코딩 필요

        if (!scheduleId || !seats) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID 또는 좌석 정보"
            });
        }

        let parsedSeats;
        try {
            parsedSeats = JSON.parse(seats); // 문자열을 배열로 변환
        } catch (err) {
            return res.status(400).send({
                error: "좌석 정보 형식이 잘못되었습니다"
            });
        }

        if (!Array.isArray(parsedSeats)) {
            return res.status(400).send({
                error: "좌석 정보는 배열이어야 합니다"
            });
        }

        const seatConditions = parsedSeats.map(seat => ({
            schedule_id: scheduleId,
            row: seat.row,
            number: seat.number
        }));

        const reservedSeats = await Seat.count({
            where: {
                [Op.or]: seatConditions
            }
        })

        if (reservedSeats > 0) {
            return res.send(false);
        }

        return res.send(true);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}