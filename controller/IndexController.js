const { Play } = require('../models');

// main 화면
exports.index = async (req, res) => {
    try {
        let { playId } = req.query;

        let play = await Play.findOne({
            where: { id: playId }
        })

        // 포스터 전달 가공 필요

        res.send({ play: play });
        // res.send({ result: true, message: "Hello World!" }); // nfc 태그 시, 진입 가능
    } catch (err) {
        console.log(err);
    }
};