const { Seat, Schedule, User, OnSite, Count, sequelize } = require("../models");
const { Op } = require('sequelize');

// user
// 현장 예매 - 공연 회차 보여주기
exports.showSchedule = async (req, res) => {
    try {
        const { playId } = req.query;

        if (!playId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 ID"
            });
        }

        // const schedules = await Schedule.findAll({
        //     attributes: ['id', 'date_time'],
        //     where: {
        //         play_id: playId
        //   }
        // });

        // 임시
        const schedules = await Schedule.findAll({
            attributes: ['id', 'date_time'],
            where: {
                play_id: playId,
                date_time: {
                    [Op.gt]: sequelize.fn('DATE_SUB', sequelize.fn('NOW'), sequelize.literal('INTERVAL 30 MINUTE'))
                }
            },
            order: [
                [sequelize.fn('ABS', sequelize.fn('TIMESTAMPDIFF', sequelize.literal('MINUTE'), sequelize.fn('NOW'), sequelize.col('date_time'))), 'ASC']
            ]
        });

        const schedulePromiese = schedules.map(async (schedule) => {
            const reservedSeats = await Seat.count({
                where: {
                    schedule_id: schedule.id,
                }
            });

            const seats = await Schedule.findOne({
                where: {
                    id: schedule.id
                }
            });

            schedule.dataValues.available_seats = seats.available_seats - reservedSeats;
        });

        await Promise.all(schedulePromiese);

        res.send({ schedules: schedules });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// 현장 예매
exports.reservation = async (req, res) => {
    console.log(64);
    const transaction = await sequelize.transaction();
    try {
        const { name, phoneNumber, headCount, scheduleId } = req.body;

        let phoneRegx = /^(01[016789]{1})-?[0-9]{4}-?[0-9]{4}$/;

        console.log(71);

        if (!name || !phoneNumber || !headCount || !scheduleId || !phoneRegx.test(phoneNumber) || isNaN(headCount) || headCount > 16) {
            await transaction.rollback();
            return res.status(400).send({
                error: "올바르지 않은 예약 정보"
            });
        }

        console.log(80);

        // 연락처 중복 확인
        const isExists = await User.findOne({
            where: {
                phone_number: phoneNumber,
                schedule_id: scheduleId
            },
            transaction
        });

        console.log(91);

        if (isExists) {
            await transaction.rollback();
            return res.send({
                success: false,
                error: "이미 예약되었습니다."
            });
        }

        // 예약 가능 인원 확인
        const reservedSeats = await Seat.count({
            where: {
                schedule_id: scheduleId,
            }
        });

        const seats = await Schedule.findOne({
            where: {
                id: scheduleId
            },
        });
        
        if (seats.available_seats < reservedSeats + headCount) {
            return res.send({
                success: false,
                error: "예약 가능 인원을 초과하였습니다."
            });
        }

        const user = await User.create({
            name: name,
            phone_number: phoneNumber,
            head_count: headCount,
            schedule_id: scheduleId,
        })

        await OnSite.create({
            user_id: user.id,
            approve: false,
        });

        req.session.userInfo = {
            id: user.id,
            phoneNumber: user.phone_number,
            name: user.name,
            headCount: user.head_count,
            scheduleId: user.schedule_id
        };

        await Count.increment('reservationCnt', {
            where: { id: 1 },
        });

        console.log(145);

        await transaction.commit();

        console.log(149);
        res.send({ success: true });
    } catch (err) {
        console.log(152);
        await transaction.rollback();
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// 현장 예매 수락 요청
exports.checkStatus = async (req, res) => {
    try {
        const { id } = req.session.userInfo;

        const user = await OnSite.findOne({
            attributes: ['approve'],
            where: {
                user_id: id
            }
        });

        if (!user) {
            return res.send({
                success: false,
                error: "예약 정보가 없습니다."
            });
        };

        res.send({ approve: user.approve });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// admin
// 현장 예매 관리 리스트
exports.showOnSite = async (req, res) => {
    try {
        const { scheduleId, name, phoneNumber, approve } = req.query;

        if (!scheduleId) {
            return res.status(400).send({
                error: "올바르지 않은 공연 일시 ID"
            });
        }

        const whereClause = {
            schedule_id: scheduleId
        }

        if (name) {
            whereClause.name = {
                [Op.like]: `%${name}%`
            };
        }

        if (phoneNumber) {
            whereClause.phone_number = {
                [Op.like]: `%${phoneNumber}%`
            };
        }

        if (approve) {
            whereClause.approve = approve;
        }

        const users = await OnSite.findAll({
            attributes: [ 'approve' ],
            include: {
                model: User,
                attributes: [ 'id', 'name', 'phone_number', 'head_count'],
                where: whereClause,
                order: [
                    ['name', 'ASC'],
                    ['phone_number', 'ASC']
                ]
            },
        });

        const approvalCnt = users.filter(user => user.approve === true).length;

        res.send({ total: users.length, approvalCnt: approvalCnt, users: users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

// 수락
exports.approveOnSite = async (req, res) => {
    try {
        const { userIds, scheduleId } = req.body;

        if (!userIds || !Array.isArray(userIds) || !scheduleId) {
            return res.status(400).send({
                error: "올바르지 않은 사용자 ID 또는 공연 일시 ID"
            });
        }

        let totalHeadCount = 0;

        for (const userId of userIds) {
            const user = await User.findOne({
                where: {
                    id: userId
                }
            });

            totalHeadCount += user.head_count;
        }

        // 예약 가능 인원 확인
        const reservedSeats = await Seat.count({
            where: {
                schedule_id: scheduleId,
            }
        });

        const seats = await Schedule.findOne({
            where: {
                id: scheduleId
            }
        });
        
        if (seats.available_seats < reservedSeats + totalHeadCount) {
            return res.send({
                success: false,
                error: "예약 가능 인원을 초과하였습니다."
            });
        }

        await OnSite.update({
            approve: true
        }, {
            where: {
                user_id: userIds // 일괄 업데이트
            }
        });

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }   
};

// 삭제
exports.deleteOnSite = async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).send({
                error: "올바르지 않은 사용자 ID"
            });
        }

        await OnSite.destroy({
            where: {
                user_id: userIds
            }
        });

        await User.destroy({
            where: {
                id: userIds
            }
        });

        res.send({ success: true });
    } catch {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};