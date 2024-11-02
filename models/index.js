'use strict';

const Sequelize = require('sequelize');
const config = require(__dirname + '/../config/config.json')['development'];
const db = {};

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);

// 모델 모듈 불러오기
const User = require('./User')(sequelize);
const Seat = require('./Seat')(sequelize);
const Reservation = require('./Reservation')(sequelize);
const Survey = require('./Survey')(sequelize);
const Play = require('./Play')(sequelize);

// 모델간의 관계 설정
// Play : Seat = 1 : N
Play.hasMany(Seat, { foreignKey: 'play_id', sourceKey: 'id' });
Seat.belongsTo(Play, { foreignKey: 'play_id', targetKey: 'id' });

// Reservation : Seat = 1 : N
Reservation.hasMany(Seat, { foreignKey: 'reservation_id', sourceKey: 'id' });
Seat.belongsTo(Reservation, { foreignKey: 'reservation_id', targetKey: 'id' });

// User : Reservation = 1 : 1
User.hasOne(Reservation, { foreignKey: 'user_id', sourceKey: 'id' });
Reservation.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

// User : Survey = 1 : 1
User.hasOne(Survey, { foreignKey: 'user_id', sourceKey: 'id' });
Survey.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

// 모델 DB 객체에 저장
db.User = User;
db.Seat = Seat;
db.Reservation = Reservation;
db.Survey = Survey;
db.Play = Play;

db.sequelize = sequelize;

module.exports = db;