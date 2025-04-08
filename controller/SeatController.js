const { Seat, Schedule, Play, User, Count, sequelize } = require('../models');
const { Op, Transaction } = require('sequelize');

// user
// 좌석 화면 - 예약된 좌석만 전달
exports.showSeats = async (req, res) => {
  try {
    const { headCount, scheduleId } = req.session.userInfo;

    const seats = await Seat.findAll({
      where: { schedule_id: scheduleId },
    });

    // await Count.increment('pickCnt', { where: { id: 1 } });

    res.send({ seats: seats, headCount: headCount });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 좌석 선택 - 이미 예약된 좌석이 있는지 확인
exports.checkReserved = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  });
  try {
    const { seats } = req.query; // seats는 { row, number } 형태의 객체 - 인코딩 필요
    const { headCount, id: userId, scheduleId } = req.session.userInfo;

    if (!seats) {
      await transaction.rollback();
      return res.status(400).send({
        error: '올바르지 않은 좌석 정보',
      });
    }

    let parsedSeats;
    try {
      const decodedSeats = decodeURIComponent(seats); // URL 디코딩
      parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
    } catch (err) {
      await transaction.rollback();
      return res.status(400).send({
        error: '좌석 정보 형식이 잘못되었습니다',
      });
    }

    if (!Array.isArray(parsedSeats)) {
      await transaction.rollback();
      return res.status(400).send({
        error: '좌석 정보는 배열이어야 합니다',
      });
    }

    // 선택한 좌석 수와 예매 인원 대조
    if (parsedSeats.length !== parseInt(headCount, 10)) {
      await transaction.rollback();
      return res.status(400).send({
        error: '예매 인원과 선택한 좌석 수가 일치하지 않습니다',
      });
    }

    // DB에 있는 좌석 수와 예매 인원 대조
    const seatCount = await Seat.count({
      where: {
        schedule_id: scheduleId,
        user_id: userId,
      },
    });

    if (seatCount >= parseInt(headCount, 10)) {
      await transaction.rollback();
      return res.status(400).send({
        error: '예매 인원을 초과했습니다',
      });
    }

    // 좌석 조건 배열 생성
    const seatConditions = parsedSeats.map((seat) => ({
      schedule_id: scheduleId,
      row: seat.row,
      number: seat.number,
    }));

    // 예약 여부 확인: 이미 예약된 좌석 존재 여부 체크 시 row-level lock 적용
    const reservedSeats = await Seat.count({
      where: {
        [Op.or]: seatConditions,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (reservedSeats > 0) {
      await transaction.rollback();
      return res.send({ success: false });
    }

    // 예매 대기 상태로 좌석 bulk 생성(한 번에 여러 건 생성)
    await Seat.bulkCreate(
      seatConditions.map((seat) => ({
        ...seat,
        user_id: userId,
      })),
      { transaction }
    );

    await transaction.commit();

    // 3분 타이머
    const timerId = setTimeout(async () => {
      try {
        // 3분 후에 예약 확정이 아니라면, 좌석 취소
        const user = await User.findOne({
          where: { id: userId },
        });

        if (user && !user.state) {
          await Seat.destroy({ where: { user_id: userId } });
        }
      } catch (error) {
        console.error('좌석 취소 중 오류 발생:', error);
      }
    }, 3 * 60 * 1000);

    req.session.userInfo.timerId = timerId.toString();

    return res.send({
      success: true,
      seats: parsedSeats,
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 발권 신청 화면
exports.showTicketing = async (req, res) => {
  try {
    const { id, scheduleId } = req.session.userInfo;

    const seats = await Seat.findAll({
      attributes: ['row', 'number', 'schedule_id'],
      where: { user_id: id },
    });

    if (!seats || seats.length === 0) {
      return res.send({ play: null, seats: [] }); // 빈 결과 반환
    }

    const play = await Schedule.findAll({
      attributes: ['date_time'],
      where: { id: scheduleId },
      include: {
        model: Play,
        attributes: ['title', 'poster', 'location'],
      },
    });

    // await Count.increment('ticketingCnt', { where: { id: 1 } });

    res.send({ play: play, seats: seats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 발권 신청
exports.requestTicketing = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, timerId, scheduleId, headCount, phoneNumber } =
      req.session.userInfo;

    // 타이머가 설정되어 있으면 취소
    if (timerId) {
      clearTimeout(parseInt(timerId, 10));
      delete req.session.userInfo.timerId;
    }

    const updatedSeatCount = await Seat.update(
      { state: true },
      {
        where: {
          user_id: id,
          schedule_id: scheduleId,
        },
        transaction,
      }
    );

    if (parseInt(updatedSeatCount, 10) !== parseInt(headCount, 10)) {
      await transaction.rollback();
      return res.status(400).send({
        success: false,
        error: '예매 인원과 선택한 좌석 수가 일치하지 않습니다',
      });
    }

    await User.update({ state: true }, { where: { id: id }, transaction });

    await transaction.commit();

    //문자보내기
    try {
      const { sendSMS } = require('../utils/SmsSender');
      await sendSMS({
        ///////////////해당 부분 phoneNumber로 교체/////////////

        to: '01023086047',

        ///////////////////////////////////////////////////////
        text: '[포도티켓] 발권이 완료되었습니다. 공연장에서 티켓을 수령해 주세요.',
      });
    } catch (smsError) {
      console.error('📵 문자 전송 실패:', smsError.message);
    }

    return res.send({ success: true });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 발권 신청에서 뒤로가기
exports.cancelTicketing = async (req, res) => {
  try {
    const { id } = req.session.userInfo;

    const user = await User.findOne({
      attributes: ['state'],
      where: { id: id },
      raw: true, // 단순 객체로 반환
    });

    if (!user) {
      return res.status(400).send({
        error: '사용자를 찾을 수 없음.',
      });
    }

    if (user.state) {
      return res.status(400).send({
        error: '이미 발권 신청이 완료됨.',
      });
    }

    await Seat.destroy({
      where: { user_id: id },
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// admin
// 실시간
exports.realTimeSeats = async (req, res) => {
  try {
    const { play } = req.session.admin;
    const { scheduleId } = req.query;

    if (!scheduleId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID',
      });
    }

    const [schedule, seats] = await Promise.all([
      await Schedule.findOne({
        attributes: ['available_seats'],
        where: {
          play_id: play,
          id: scheduleId,
        },
      }),
      await Seat.findAll({
        attributes: ['id', 'row', 'number', 'state', 'user_id', 'lock'],
        where: {
          schedule_id: scheduleId,
          state: true,
        },
      }),
    ]);

    if (!schedule) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID',
      });
    }

    // 여석
    const availableSeats = schedule.available_seats - seats.length;

    res.send({ seats, availableSeats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 관객 정보
exports.showAudience = async (req, res) => {
  try {
    const { play } = req.session.admin;
    const { scheduleId, seatId } = req.query;

    if (!scheduleId || !seatId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID 또는 좌석 ID',
      });
    }

    const [schedule, seat] = await Promise.all([
      Schedule.findOne({
        where: {
          play_id: play,
          id: scheduleId,
        },
      }),
      Seat.findOne({
        where: {
          id: seatId,
        },
      }),
    ]);

    if (!schedule) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID',
      });
    }

    if (!seat) {
      return res.status(400).send({
        error: '해당 좌석 정보를 찾을 수 없습니다.',
      });
    }

    const [user, seats] = await Promise.all([
      User.findOne({
        attributes: ['name', 'phone_number', 'head_count'],
        where: {
          id: seat.user_id,
        },
      }),
      Seat.findAll({
        attributes: ['row', 'number'],
        where: {
          schedule_id: scheduleId,
          user_id: seat.user_id,
        },
      }),
    ]);

    res.send({ user, seats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 잠금 확인 팝업
exports.checkSeats = async (req, res) => {
  try {
    const { scheduleId, seats } = req.body; // seats는 { row, number } 형태의 객체 - 인코딩 필요

    if (!scheduleId || !seats) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID 또는 좌석 정보',
      });
    }

    let parsedSeats;
    try {
      const decodedSeats = decodeURIComponent(seats); // URL 디코딩
      parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
    } catch (err) {
      return res.status(400).send({
        error: '좌석 정보 형식이 잘못되었습니다',
      });
    }

    if (!Array.isArray(parsedSeats)) {
      return res.status(400).send({
        error: '좌석 정보는 배열이어야 합니다',
      });
    }

    const seatConditions = parsedSeats.map((seat) => ({
      schedule_id: scheduleId,
      row: seat.row,
      number: seat.number,
    }));

    // 예약된 좌석과 스케줄 정보를 한 번의 쿼리로 조회
    const reservedSeats = await Seat.findAll({
      where: {
        [Op.or]: seatConditions,
      },
      include: [
        {
          attributes: ['date_time'],
          model: Schedule,
          as: 'schedule',
          required: true,
        },
      ],
    });

    if (parseInt(reservedSeats.length, 10) > 0) {
      const reservedList = reservedSeats.map((seat) => ({
        row: seat.row,
        number: seat.number,
        dateTime: seat.schedule.date_time,
      }));

      return res.send({ success: true, reservedList });
    }

    res.send({ success: true, reservedList: [] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 실시간 좌석 편집 - 좌석 잠그기
exports.lockSeats = async (req, res) => {
  try {
    const { scheduleId, seats } = req.body; // seats는 { row, number } 형태의 객체 - 인코딩 필요

    if (!scheduleId || !seats) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID 또는 좌석 정보',
      });
    }

    let parsedSeats;
    try {
      const decodedSeats = decodeURIComponent(seats); // URL 디코딩
      parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
    } catch (err) {
      return res.status(400).send({
        error: '좌석 정보 형식이 잘못되었습니다',
      });
    }

    if (!Array.isArray(parsedSeats)) {
      return res.status(400).send({
        error: '좌석 정보는 배열이어야 합니다',
      });
    }

    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    // 모든 scheduleId에 대해 한 번에 기존 좌석 조회
    const existingSeats = await Seat.findAll({
      where: {
        schedule_id: { [Op.in]: scheduleId },
        [Op.or]: parsedSeats.map((seat) => ({
          [Op.and]: [{ row: seat.row }, { number: seat.number }],
        })),
      },
      attributes: [
        'id',
        'schedule_id',
        'row',
        'number',
        'state',
        'lock',
        'user_id',
      ],
      transaction,
    });

    // 기존 좌석을 Map으로 변환하여 빠른 검색이 가능하게 함
    const existingSeatMap = new Map(
      existingSeats.map((seat) => [
        `${seat.schedule_id}-${seat.row}-${seat.number}`,
        seat,
      ])
    );

    const seatsToCreate = [];
    const seatsToLock = [];

    for (const id of scheduleId) {
      for (const seat of parsedSeats) {
        const key = `${id}-${seat.row}-${seat.number}`;
        const existingSeat = existingSeatMap.get(key);

        if (!existingSeat) {
          // 좌석이 존재하지 않으면 생성
          seatsToCreate.push({
            schedule_id: id,
            row: seat.row,
            number: seat.number,
            state: true,
            lock: true,
            user_id: null,
          });
        } else if (!existingSeat.lock && !existingSeat.user_id) {
          // 좌석이 존재하고, 잠기지 않았으면 잠금 목록에 추가
          seatsToLock.push(existingSeat.id);
        }
      }
    }

    // 새 좌석 생성 -  배치 처리
    if (seatsToCreate.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < seatsToCreate.length; i += batchSize) {
        const batch = seatsToCreate.slice(i, i + batchSize);
        await Seat.bulkCreate(batch, { transaction });
      }
    }

    // 기존 좌석 잠금 (이미 발권된 좌석 제외)
    if (seatsToLock.length > 0) {
      await Seat.update(
        { lock: true },
        {
          where: {
            id: { [Op.in]: seatsToLock },
            user_id: null,
            state: 0,
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 실시간 좌석 편집 - 좌석 잠금 해제
exports.unlockSeats = async (req, res) => {
  try {
    const { scheduleId, seats } = req.body; // seats는 { row, number } 형태의 객체 - 인코딩 필요

    if (!scheduleId || !seats) {
      return res.status(400).send({
        success: false,
        error: '올바르지 않은 공연 일시 ID 또는 좌석 정보',
      });
    }

    let parsedSeats;
    try {
      const decodedSeats = decodeURIComponent(seats); // URL 디코딩
      parsedSeats = JSON.parse(decodedSeats); // 문자열을 배열로 변환
    } catch (err) {
      return res.status(400).send({
        success: false,
        error: '좌석 정보 형식이 잘못되었습니다',
      });
    }

    if (!Array.isArray(parsedSeats)) {
      return res.status(400).send({
        success: false,
        error: '좌석 정보는 배열이어야 합니다',
      });
    }

    const seatConditions = parsedSeats.map((seat) => ({
      row: seat.row,
      number: seat.number,
    }));

    await Seat.destroy({
      where: {
        schedule_id: scheduleId, // scheduleId가 배열일 경우 자동으로 IN 조건 처리됨
        [Op.or]: seatConditions,
      },
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
