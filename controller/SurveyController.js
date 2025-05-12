const { Survey } = require('../models');

// 전반적인 만족도
exports.questionOne = async (req, res) => {
  try {
    const { answer } = req.body;
    // const { id } = req.session.userInfo;

    // const user = await Survey.findOne({
    //   where: {
    //     user_id: id,
    //     question: 1,
    //   },
    // });

    // if (user) {
    //   return res.status(400).send({
    //     error: '이미 서비스 평가가 완료됨.',
    //   });
    // }

    if (!answer || answer < 1 || answer > 5) {
      return res.status(400).send({
        error: '잘못된 입력',
      });
    }

    await Survey.create({
      question: 1,
      answer: answer,
      // user_id: id,
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 추천 의향
exports.questionTwo = async (req, res) => {
  try {
    const { answer } = req.body;
    // const { id } = req.session.userInfo;

    // const user = await Survey.findOne({
    //   where: {
    //     user_id: id,
    //     question: 2,
    //   },
    // });

    // if (user) {
    //   return res.status(400).send({
    //     error: '이미 서비스 평가가 완료됨.',
    //   });
    // }

    if (!answer || answer < 0 || answer > 10) {
      return res.status(400).send({
        error: '잘못된 입력',
      });
    }

    await Survey.create({
      question: 2,
      answer: answer,
      // user_id: id,
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
