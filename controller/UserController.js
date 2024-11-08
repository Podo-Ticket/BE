const { User } = require('../models');

// 예약 확인
exports.checkReservation = async (req, res) => {
    try {
        const { phoneNumber } = req.query;

        if(!phoneNumber) {
            return res.status(400).send({
                error: "올바르지 않은 전화번호"
            });
        }

        const user = await User.findOne({
            where: {
                phone_number: phoneNumber
            }
        });

        // 이미 예약을 했을 경우 추가 필요

        if (user) {
            req.session.userInfo={
                id: user.id,
                phoneNumber: user.phone_number,
                name: user.name,
                headCount: user.head_count
            }

            console.log(req.session.userInfo);

            return res.send(true);
        }
        else
            return res.send(false);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};