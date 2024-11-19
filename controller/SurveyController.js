const { Survey } = require('../models');

// 서비스 평가
exports.evaluateService = async (req, res) => {
    try {
        const { answer } = req.body;
        const { id } = req.session.userInfo;

        const user = await Survey.findOne({
            where: { userId: id }
        });

        if (user) {
            return res.status(400).send({
                error: "이미 서비스 평가가 완료됨."
            });
        }

        if (!answer || answer < 0 || answer > 3) {
            return res.status(400).send({
                error: "잘못된 입력"
            });
        }

        await Survey.create({
            answer: answer,
            user_id: id,
        });

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}