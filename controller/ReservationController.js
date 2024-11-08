const { Seat, Schedule, User } = require("../models");

exports.reservation = async (req, res) => {
    try {
        const { name, phoneNumber, headCount, scheduleId } = req.body;

        let phoneRegx = /^(01[016789]{1})-?[0-9]{4}-?[0-9]{4}$/;

        if (!name || !phoneNumber || !headCount || !scheduleId || !phoneRegx.test(phoneNumber) || isNaN(headCount)) {
            return res.status(400).send({
                error: "올바르지 않은 예약 정보"
            });
        }

        // 연락처 중복 확인
        const isExists = await User.findOne({
            where: {
                phone_number: phoneNumber
            }
        });

        if (isExists) {
            return res.status(400).send({
                error: "이미 예약되어있습니다."
            });
        }

        // 예약 가능 인원 확인
        const reservedSeats = await Seat.count({
            where: {
                schedule_id: scheduleId,
            }
        });

        const seats = await Schedule.findOne({
            where: {
                id: scheduleId
            }
        });
        
        if (seats.available_seats < reservedSeats + headCount) {
            return res.status(400).send({
                error: "예약 가능 인원을 초과하였습니다."
            });
        }

        await User.create({
            name: name,
            phone_number: phoneNumber,
            head_count: headCount,
            schedule_id: scheduleId
        })

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};