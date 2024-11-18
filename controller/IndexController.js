const { Play, sequelize } = require('../models');
const { Schedule } = require('../models');
const { Op } = require('sequelize');

// main 화면
exports.index = async (req, res) => {
    try {
        let { playId } = req.query;

        if(!playId) {
            return res.status(400).send({ 
                error: "올바르지 않은 공연 ID" 
            });
        }

        const schedule = await Schedule.findOne({
            attributes: ['id', 'date_time', 'play_id'],
            where: {
                play_id: playId,
                date_time: {
                    [Op.gt]: sequelize.literal("NOW() - INTERVAL '30 minutes'")
                }
            },
            order: [
                [sequelize.fn('ABS', sequelize.literal('DATEDIFF(date_time, NOW())')), 'ASC']
            ]
        });

        const play = await Play.findOne({
            attributes:['title', 'poster'],
            where: {
                id: schedule.play_id
            }
        });

        if(!play) {
            return res.status(404).send({ 
                error: "공연 조회 불가" 
            });
        }

        res.send({ play: play, schedule: schedule });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// health check
exports.health = async (req, res) => {
    res.send("ok");
};