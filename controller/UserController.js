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

        if (user) {
            if (user.state === true) {
                return res.send({
                    success: false,
                    data: "이미 발권한 사용자"
                });
            }

            req.session.userInfo={
                id: user.id,
                phoneNumber: user.phone_number,
                name: user.name,
                headCount: user.head_count
            }

            return res.send({ success: true });
        }
        else {
            return res.send({
                success: false,
                data: "예매 내역 확인 불가" 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};