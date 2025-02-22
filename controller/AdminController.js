// 접속
exports.enterAdmin = async (req, res) => {
  try {
    const { code } = req.query;

    let adminCode = process.env.ADMIN_CODE;
    let play_id = process.env.PLAY_ID; // 광운극회 단막극 공연 id

    if (code !== adminCode) {
      return res.status(400).send({
        error: '잘못된 인증코드',
      });
    }

    req.session.admin = {
      code: adminCode,
      play: play_id,
    };

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
