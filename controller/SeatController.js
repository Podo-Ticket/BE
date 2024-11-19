const { Seat, Schedule, Play, User, Count } = require('../models');
const Op = require('sequelize').Op;

// user
// 좌석 화면 - 예약된 좌석만 전달
exports.showSeats = async (req, res) => {
    try {
        const { headCount, scheduleId } = req.session.userInfo;

        const seats = await Seat.findAll({
            where: {
                schedule_id: scheduleId
            }
        });

        await Count.increment('pickCnt', { where: { id: 1 } });

        res.send({ seats: seats, headCount: headCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 좌석 선택 - 이미 예약된 좌석이 있는지 확인
exports.checkReserved = async (req, res) => {
    try {
        const { scheduleId, seats } = req.query; // seats는 { row, number } 형태의 객체 - 인코딩 필요
        const { headCount } = req.session.userInfo;

        if (!scheduleId || !seats) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID 또는 좌석 정보"
            });
        }

        let parsedSeats;
        try {
            const decodedSeats = decodeURIComponent(seats); // URL 디코딩
            parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
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

        // 선택한 좌석 수와 예매 인원 대조
        if (parsedSeats.length != headCount) { // 강한 비교로 바꿔야 함
            return res.status(400).send({
                error: "예매 인원과 선택한 좌석 수가 일치하지 않습니다"
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

        if (reservedSeats > 0)
            return res.send({ success: false });

        // 예매 대기 상태 설정
        await Seat.bulkCreate(seatConditions.map(seat => ({
            ...seat,
            user_id: req.session.userInfo.id,
        })));

        // 3분 타이머
        const timerId = setTimeout(async () => {
            try {
                // 3분 후에 예약 확정이 아니라면, 좌석 취소
                const user = await User.findOne({ where: { id: req.session.userInfo.id } });
    
                if (user && !user.state) {
                    await Seat.destroy({ where: { user_id: req.session.userInfo.id } });
                }
            } catch (error) {
                console.error('좌석 취소 중 오류 발생:', error);
            }
        }, 3 * 60 * 1000);

        req.session.userInfo.timerId = timerId.toString();

        return res.send({
            success: true,
            seats: parsedSeats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 발권 신청 화면
exports.showTicketing = async (req,res) => {
    try {
        const { id } = req.session.userInfo;

        const seats = await Seat.findAll({
            attributes: [ 'row', 'number', 'schedule_id' ],
            where: { user_id: id },
        });

        const play = await Schedule.findAll({
            attributes: ['date_time'],
            where: { id: seats[0].schedule_id },
            include: {
                model: Play,
                attributes: ['title', 'poster'],

            }
        });

        await Count.increment('ticketingCnt', { where: { id: 1 } });

        res.send({ play: play, seats: seats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 발권 신청
exports.requestTicketing = async (req, res) => {
    try {
        const { id, timerId } = req.session.userInfo;

        // 타이머가 설정되어 있으면 취소
        if(timerId) {
            clearTimeout(parseInt(timerId, 10));
            delete req.session.userInfo.timerId;
        }
        
        // await Seat.update(
        //     { state: true },
        //     { where: { user_id: id } }
        // );

        // 좌석 정보 가져오기
        const seats = await Seat.findAll({
            attributes: ['row', 'number'],
            where: { user_id: id },
        });

        // 좌석 상태 업데이트
        await Seat.update(
            { state: true },
            {
                where: {
                    user_id: id,
                    [Op.or]: seats.map(seat => ({
                        row: seat.row,
                        number: seat.number
                    }))
                }
            }
        );

        await User.update(
            { state: true },
            { where: { id: id } }
        )

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 발권 신청에서 뒤로가기
exports.cancelTicketing = async (req, res) => {
    try {
        const { id } = req.session.userInfo;

        const user = await User.findOne({
            where: { id: id }
        })

        if (user.state) {
            return res.status(400).send({
                error: "이미 발권 신청이 완료됨."
            });
        }

        await Seat.destroy({
            where: { user_id: id }
        });

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// admin
// 실시간
exports.realTimeSeats = async (req, res) => {
    try {
        const { play } = req.session.admin;
        const { scheduleId } = req.query;

        if (!scheduleId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID"
            });
        }

        const schedule = await Schedule.findOne({
            where: {
                play_id: play,
                id: scheduleId,
            }
        });

        if (!schedule) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID"
            });
        }

        const seats = await Seat.findAll({
            attributes: ['id', 'row', 'number', 'state', 'user_id', 'lock'],
            where: { 
                schedule_id: schedule.id,
                state: true
            }
        })

        // 여석
        const availableSeats = schedule.available_seats - seats.length;

        res.send({ seats: seats, availableSeats: availableSeats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 관객 정보
exports.showAudience = async (req, res) => {
    try {
        const { play } = req.session.admin;
        const { scheduleId, seatId } = req.query;

        if (!scheduleId || !seatId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID 또는 좌석 ID"
            });
        }

        const schedule = await Schedule.findOne({
            where: {
                play_id: play,
                id: scheduleId
            }
        });

        if (!schedule) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID"
            });
        }

        const seat = await Seat.findOne({
            where: {
                id: seatId
            }
        });

        const user = await User.findOne({
            attributes: ['name', 'phone_number', 'head_count'],
            where: {
                id: seat.user_id
            }
        });

        const seats = await Seat.findAll({
            attributes: ['row', 'number'],
            where: {
                schedule_id: scheduleId,
                user_id: seat.user_id
            }
        });

        res.send({ user: user, seats: seats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 실시간 좌석 편집 - 좌석 잠그기
exports.lockSeats = async (req, res) => {
    try {
        const { scheduleId, seats } = req.body; // seats는 { row, number } 형태의 객체 - 인코딩 필요

        if (!scheduleId || !seats) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID 또는 좌석 정보"
            });
        }

        let parsedSeats;
        try {
            const decodedSeats = decodeURIComponent(seats); // URL 디코딩
            parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
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

        if (reservedSeats > 0)
            return res.send({ success: false });

        // 전체 잠금
        await Seat.bulkCreate(parsedSeats.map(seat => ({
            schedule_id: scheduleId,
            row: seat.row,
            number: seat.number,
            user_id: null,
            state: true,
            lock: true
        })));

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}

// 실시간 좌석 편집 - 좌석 잠금 해제
exports.unlockSeats = async (req, res) => {
    try {
        const { scheduleId, seatIds } = req.body;

        if (!scheduleId || !seatIds) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID 또는 좌석 ID 정보"
            });
        }

        // 전체 잠금
        await Seat.destroy({ 
            where: {
                schedule_id: scheduleId,
                id: seatIds 
            } 
        });

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}