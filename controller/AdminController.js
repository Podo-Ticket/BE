// 접속
exports.enterAdmin = async (req, res) => {
    try {
        const { code }  = req.query;

        let adminCode = "JAKGONG"; // 작은 공간 관리자 코드
        let play_id = 1; // 작은 공간 공연 id

        if (code !== adminCode) {
            return res.status(400).send({
                error: "잘못된 인증코드"
            });
        }

        req.session.admin = {
            code: adminCode,
            play: play_id
        }

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
}