const { Play } = require('../models');

// main 화면
exports.index = async (req, res) => {
    try {
        let { playId } = req.query;

        if(!playId) {
            return res.status(400).send({ 
                error: "올바르지 않은 공연 ID" 
            });
        }

        let play = await Play.findOne({
            where: { id: playId }
        })

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