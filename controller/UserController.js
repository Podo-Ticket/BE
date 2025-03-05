const { User, Schedule, sequelize, OnSite } = require('../models');
const { Op, Sequelize } = require('sequelize');

// user
// 예약 확인
exports.checkReservation = async (req, res) => {
  try {
    const { phoneNumber, scheduleId } = req.query;

    if (!phoneNumber || !scheduleId) {
      return res.status(400).send({
        error: '올바르지 않은 전화번호 또는 공연 일시 ID',
      });
    }

    const user = await User.findOne({
      where: {
        phone_number: phoneNumber,
        schedule_id: scheduleId,
      },
      include: {
        model: OnSite,
        as: 'on_site',
        attributes: ['approve'],
      },
    });

    if (!user) {
      return res.send({
        success: false,
        data: '예매 내역 확인 불가',
      });
    }

    const approveValue = user.OnSite ? user.OnSite.approve : null;

    if (approveValue === false) {
      return res.send({
        success: false,
        data: '현장 예매 수락 대기 중',
      });
    }

    const sessionInfo = {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name,
      headCount: user.head_count,
      scheduleId: user.schedule_id,
    };

    req.session.userInfo = sessionInfo;

    return res.send(
      user.state
        ? { user: sessionInfo, data: '이미 발권한 사용자' }
        : { success: true }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// admin
// 명단 관리
exports.showList = async (req, res) => {
  try {
    const { scheduleId, name, phoneNumber, state } = req.query;

    if (!scheduleId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID',
      });
    }

    const whereClause = {
      schedule_id: scheduleId,
    };

    if (name) {
      whereClause.name = {
        [Op.like]: `%${name}%`,
      };
    }

    if (phoneNumber) {
      whereClause.phone_number = {
        [Op.like]: `%${phoneNumber}%`,
      };
    }

    if (state) {
      whereClause.state = state;
    }

    whereClause.id = {
      [Op.notIn]: Sequelize.literal(
        '(SELECT user_id FROM on_site WHERE approve = false)'
      ),
    };

    const usersPromise = await User.findAll({
      attributes: ['id', 'name', 'phone_number', 'head_count', 'state'],
      where: whereClause,
      order: [
        ['name', 'ASC'],
        ['phone_number', 'ASC'],
      ],
    });

    const ticketingCntPromise = User.count({
      where: { ...whereClause, state: true },
    });

    const [users, ticketingCnt] = await Promise.all([
      usersPromise,
      ticketingCntPromise,
    ]);

    res.send({ total: users.length, ticketingCnt: ticketingCnt, users: users });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 공연 회차 선택 / 명단 추가 - 공연 회차 보여주기
exports.showSchedule = async (req, res) => {
  try {
    const { play } = req.session.admin;

    // 간단 버전
    // const schedules = await Schedule.findAll({
    //   attributes: [
    //     'id',
    //     'date_time',
    //     [
    //       sequelize.literal(
    //         `available_seats -
    //         COALESCE((SELECT SUM(u.head_count) FROM user u LEFT JOIN on_site o ON u.id = o.user_id WHERE u.schedule_id = schedule.id AND o.user_id IS NULL), 0) -
    //         COALESCE((SELECT SUM(u.head_count) FROM user u JOIN on_site o ON u.id = o.user_id WHERE u.schedule_id = schedule.id AND o.approve = 1), 0) -
    //         (SELECT COUNT(*) FROM seat WHERE seat.schedule_id = schedule.id AND seat.lock = 1)`
    //       ),
    //       'free_seats',
    //     ],
    //   ],
    //   where: {
    //     play_id: play,
    //   },
    // });

    const schedules = await sequelize.query(
      `
      SELECT 
        s.id, 
        s.date_time,
        s.available_seats 
          - COALESCE(r1.sum_head_count, 0)
          - COALESCE(r2.sum_head_count, 0)
          - COALESCE(r3.locked_seat_count, 0) AS free_seats
      FROM schedule s
      LEFT JOIN (
        SELECT u.schedule_id, SUM(u.head_count) AS sum_head_count
        FROM user u
        LEFT JOIN on_site o ON u.id = o.user_id
        WHERE o.user_id IS NULL
        GROUP BY u.schedule_id
      ) r1 ON s.id = r1.schedule_id
      LEFT JOIN (
        SELECT u.schedule_id, SUM(u.head_count) AS sum_head_count
        FROM user u
        JOIN on_site o ON u.id = o.user_id
        WHERE o.approve = 1
        GROUP BY u.schedule_id
      ) r2 ON s.id = r2.schedule_id
      LEFT JOIN (
        SELECT schedule_id, COUNT(*) AS locked_seat_count
        FROM seat
        WHERE \`lock\` = 1
        GROUP BY schedule_id
      ) r3 ON s.id = r3.schedule_id
      WHERE s.play_id = :playId
      `,
      {
        replacements: { playId: play },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    res.send({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 명단 추가
exports.reservationAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, phoneNumber, headCount, scheduleId } = req.body;

    let phoneRegx = /^(01[016789]{1})-?[0-9]{4}-?[0-9]{4}$/;

    if (
      !name ||
      !phoneNumber ||
      !headCount ||
      !scheduleId ||
      !phoneRegx.test(phoneNumber) ||
      isNaN(headCount) ||
      parseInt(headCount) > 16
    ) {
      return res.status(400).send({
        error: '올바르지 않은 예약 정보',
      });
    }

    // 한 번의 쿼리로 예약 가능 인원 확인
    // 간단 버전
    const scheduleInfo = await Schedule.findOne({
      where: { id: scheduleId },
      attributes: [
        'id',
        [
          sequelize.literal(
            `available_seats -
            COALESCE((SELECT SUM(u.head_count) FROM user u LEFT JOIN on_site o ON u.id = o.user_id WHERE u.schedule_id = schedule.id AND o.user_id IS NULL), 0) -
            COALESCE((SELECT SUM(u.head_count) FROM user u JOIN on_site o ON u.id = o.user_id WHERE u.schedule_id = schedule.id AND o.approve = 1), 0) -
            (SELECT COUNT(*) FROM seat WHERE seat.schedule_id = schedule.id AND seat.lock = 1)`
          ),
          'available_seats',
        ],
      ],
      transaction,
    });

    if (!scheduleInfo) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '스케줄을 찾을 수 없습니다.',
      });
    }

    // 좌석 가용성 체크
    if (
      parseInt(scheduleInfo.getDataValue('available_seats'), 10) <
      parseInt(headCount)
    ) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '예약 가능 인원을 초과하였습니다.',
      });
    }

    // 중복 예약 체크 - FOR UPDATE 락을 사용하여 동시성 제어
    const isExists = await User.findOne({
      where: {
        phone_number: phoneNumber,
        schedule_id: scheduleId,
      },
      lock: transaction.LOCK.UPDATE, // 동시성 제어
      transaction,
    });

    if (isExists) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '이미 예약되었습니다.',
      });
    }

    // 예약 생성
    await User.create(
      {
        name,
        phone_number: phoneNumber,
        head_count: headCount,
        schedule_id: scheduleId,
      },
      { transaction }
    );

    await transaction.commit();
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 명단 확인 - 사용자 정보 보여주기
exports.showAudienceInfo = async (req, res) => {
  try {
    const { scheduleId, userId } = req.query;

    if (!scheduleId || !userId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 일시 ID 또는 사용자 ID',
      });
    }

    const user = await User.findOne({
      attributes: [
        'name',
        'phone_number',
        'head_count',
        'schedule_id',
        'state',
      ],
      where: {
        id: userId,
        schedule_id: scheduleId,
      },
      include: {
        model: Schedule,
        attributes: ['date_time'],
      },
    });

    res.send({ user: user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 예매 삭제 확인
exports.deleteAudience = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).send({
        error: '올바르지 않은 사용자 ID',
      });
    }

    await User.destroy({
      where: {
        id: userId,
      },
    });

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 수정 중 - 회원 정보 수정
exports.updateAudience = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId, name, phoneNumber, headCount, scheduleId } = req.body;

    let phoneRegx = /^(01[016789]{1})-?[0-9]{4}-?[0-9]{4}$/;

    if (
      !userId ||
      !name ||
      !phoneNumber ||
      !headCount ||
      !phoneRegx.test(phoneNumber) ||
      isNaN(headCount) ||
      headCount > 16 ||
      !scheduleId
    ) {
      return res.status(400).send({
        error: '올바르지 않은 변경 정보',
      });
    }

    // 한 번의 쿼리로 예약 가능 인원 확인
    const scheduleInfo = await Schedule.findOne({
      where: { id: scheduleId },
      attributes: [
        'id',
        'available_seats',
        [
          sequelize.literal(`(
                    SELECT COUNT(*) 
                    FROM seat 
                    WHERE schedule_id = ${scheduleId}
                )`),
          'reserved_seats',
        ],
      ],
      transaction,
    });

    if (!scheduleInfo) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '스케줄을 찾을 수 없습니다.',
      });
    }

    // 좌석 가용성 체크
    if (
      scheduleInfo.available_seats <
      scheduleInfo.getDataValue('reserved_seats') + parseInt(headCount)
    ) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '예약 가능 인원을 초과하였습니다.',
      });
    }

    await User.update(
      {
        name: name,
        phone_number: phoneNumber,
        head_count: headCount,
        schedule_id: scheduleId,
      },
      {
        where: {
          id: userId,
        },
      },
      { transaction }
    );

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};
