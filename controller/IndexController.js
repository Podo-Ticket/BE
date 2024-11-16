const { Play } = require('../models');
const { Schedule } = require('../models');

// main 화면
exports.index = async (req, res) => {
    try {
        let { scheduleId } = req.query;

        if(!scheduleId) {
            return res.status(400).send({ 
                error: "올바르지 않은 공연 일시 ID" 
            });
        }

        const play = await Schedule.findOne({
            attributes: ['id', 'date_time'],
            where: { id: scheduleId },
            include: {
                model: Play,
                attributes: ['id', 'title', 'poster']
            },
        });

        if(!play) {
            return res.status(404).send({ 
                error: "공연 조회 불가" 
            });
        }

        res.send({ play: play });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// health check
exports.health = async (req, res) => {
    res.send("ok");
};