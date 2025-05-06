const { Seat, Schedule, User, OnSite, Count, sequelize } = require('../models');
const { Op, Transaction } = require('sequelize');

// user
// 현장 예매 - 공연 회차 보여주기
exports.showSchedule = async (req, res) => {
  try {
    const { playId } = req.query;

    if (!playId) {
      return res.status(400).send({
        error: '올바르지 않은 공연 ID',
      });
    }

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
    //     play_id: playId,
    //   },
    // });

    const schedules = await sequelize.query(
      `
      SELECT 
        s.id, 
        s.date_time,
        GREATEST(
          s.available_seats 
            - COALESCE(r1.sum_head_count, 0)
            - COALESCE(r2.sum_head_count, 0)
            - COALESCE(r3.locked_seat_count, 0),
          0
        ) AS free_seats
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
        replacements: { playId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.send({ schedules });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 현장 예매
exports.reservation = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  });
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
      await transaction.rollback();
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
      parseInt(headCount, 10)
    ) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '예약 가능 인원을 초과하였습니다.',
      });
    }

    // 중복 예약 체크 - 명시적 트랜잭션에서 행 락을 설정하여 동시성 제어
    const isExists = await User.findOne({
      where: {
        phone_number: phoneNumber,
        schedule_id: scheduleId,
      },
      transaction,
      lock: transaction.LOCK.UPDATE, // row-level lock 적용
    });

    if (isExists) {
      await transaction.rollback();
      return res.send({
        success: false,
        error: '이미 예약되었습니다.',
      });
    }

    // 예약 생성 - Promise.all로 병렬 처리
    const [user, _] = await Promise.all([
      User.create(
        {
          name,
          phone_number: phoneNumber,
          head_count: headCount,
          schedule_id: scheduleId,
        },
        { transaction }
      ),

      // Count.increment('reservationCnt', {
      //   where: { id: 1 },
      //   transaction,
      // }),
    ]);

    // 현장 예약 정보 생성
    await OnSite.create(
      {
        user_id: user.id,
        approve: false,
      },
      { transaction }
    );

    // 세션 정보 업데이트
    req.session.userInfo = {
      id: user.id,
      phoneNumber: user.phone_number,
      name: user.name,
      headCount: user.head_count,
      scheduleId: user.schedule_id,
    };

    await transaction.commit();
    res.send({ success: true, userId: user.id });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// admin
// 현장 예매 관리 리스트
exports.showOnSite = async (req, res) => {
  try {
    const { scheduleId, name, phoneNumber } = req.query;

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

    const usersPromises = await OnSite.findAll({
      attributes: ['approve'],
      include: {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'phone_number', 'head_count'],
        where: whereClause,
        order: [
          ['name', 'ASC'],
          ['phone_number', 'ASC'],
        ],
      },
    });

    const approvalCntPromise = await OnSite.count({
      where: {
        approve: true,
      },
      include: [
        {
          model: User,
          as: 'user',
          where: whereClause,
        },
      ],
    });

    const [users, approvalCnt] = await Promise.all([
      usersPromises,
      approvalCntPromise,
    ]);

    res.send({ total: users.length, approvalCnt: approvalCnt, users: users });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 수락 / 거절
exports.approveOnSite = async (req, res) => {
  try {
    const { userIds, scheduleId, check } = req.body;
    const io = req.app.get('io');

    if (!userIds || !Array.isArray(userIds) || !scheduleId || check == null) {
      return res.status(400).send({
        error: '올바르지 않은 사용자 ID, 공연 일시 ID, 수락 여부',
      });
    }

    if (!check) {
      userIds.forEach((userId) => {
        const message = {
          type: 'reject',
          message: `사용자 ${userId}님의 현장 신청이 거절되었습니다.`,
        };
        console.log(`Sending WebSocket message to user:${userId}`, message); // 로그 추가
        io.emit(`user:${userId}`, message);
      });

      await Promise.all([
        OnSite.destroy({
          where: { user_id: { [Op.in]: userIds } },
        }),
        User.destroy({
          where: { id: { [Op.in]: userIds } },
        }),
      ]);

      return res.send({ accept: false });
    }

    // 사용자들의 head_count 합산
    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds },
      },
      attributes: ['id', 'head_count'],
    });

    if (users.length !== userIds.length) {
      return res.send({
        success: false,
        error: '일부 사용자를 찾을 수 없습니다.',
      });
    }

    const totalHeadCnt = users.reduce((sum, user) => sum + user.head_count, 0);

    const [reservedSeats, schedule] = await Promise.all([
      Seat.count({
        where: { schedule_id: scheduleId },
      }),
      Schedule.findOne({
        where: { id: scheduleId },
        attributes: ['available_seats'],
      }),
    ]);

    if (!schedule) {
      return res.send({
        success: false,
        error: '스케줄을 찾을 수 없습니다.',
      });
    }

    if (schedule.available_seats < reservedSeats + totalHeadCnt) {
      return res.send({
        success: false,
        error: '예약 가능 인원을 초과하였습니다.',
      });
    }

    await OnSite.update(
      { approve: true },
      { where: { user_id: { [Op.in]: userIds } } }
    );

    // WebSocket 실시간 알림 전송
    userIds.forEach((userId) => {
      const message = {
        type: 'approval',
        message: `사용자 ${userId}님의 현장 신청이 승인되었습니다.`,
      };
      console.log(`Sending WebSocket message to user:${userId}`, message);
      io.emit(`user:${userId}`, message);
    });

    res.send({ accept: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

// 삭제
exports.deleteOnSite = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).send({
        error: '올바르지 않은 사용자 ID',
      });
    }

    await Promise.all([
      OnSite.destroy({
        where: { user_id: { [Op.in]: userIds } },
      }),
      User.destroy({
        where: { id: { [Op.in]: userIds } },
      }),
    ]);

    res.send({ success: true });
  } catch {
    console.error(err);
    res.status(500).send('Internal server error');
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { id, scheduleId } = req.session.userInfo;

    if (!id || !scheduleId) {
      return res.status(400).send({
        error: '올바르지 않은 사용자 ID 또는 스케줄 ID입니다.',
      });
    }

    await Seat.destroy({
      where: {
        user_id: id,
        schedule_id: scheduleId,
      },
    });

    await User.update(
      { state: 0 },
      {
        where: { id: id, schedule_id: scheduleId },
      }
    );

    return res
      .status(200)
      .send({ message: '예매가 성공적으로 취소되었습니다.' });
  } catch (err) {
    console.error('에러 발생:', err);
    return res
      .status(500)
      .send({ error: '서버 오류로 인해 예매 취소에 실패했습니다.' });
  }
};
