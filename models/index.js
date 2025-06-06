'use strict';

require('dotenv').config();

const Sequelize = require('sequelize');
const db = {};

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    timezone: '+09:00',
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
    },
  }
);

// 모델 모듈 불러오기
const User = require('./User')(sequelize);
const Seat = require('./Seat')(sequelize);
const Survey = require('./Survey')(sequelize);
const Play = require('./Play')(sequelize);
const Schedule = require('./Schedule')(sequelize);
const OnSite = require('./OnSite')(sequelize);
const Count = require('./Count')(sequelize);

// 모델간의 관계 설정
// Play : Schedule = 1 : N
Play.hasMany(Schedule, { foreignKey: 'play_id', sourceKey: 'id' });
Schedule.belongsTo(Play, { foreignKey: 'play_id', targetKey: 'id' });

// Schedule : Seat = 1 : N
Schedule.hasMany(Seat, { foreignKey: 'schedule_id', sourceKey: 'id' });
Seat.belongsTo(Schedule, { foreignKey: 'schedule_id', targetKey: 'id' });

// User : Seat = 1 : N
User.hasMany(Seat, {
  foreignKey: 'user_id',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
Seat.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'id',
  onDelete: 'CASCADE',
});

// Schedule : User = 1 : N
Schedule.hasMany(User, { foreignKey: 'schedule_id', sourceKey: 'id' });
User.belongsTo(Schedule, { foreignKey: 'schedule_id', targetKey: 'id' });

// User : Survey = 1 : 1
User.hasOne(Survey, { foreignKey: 'user_id', sourceKey: 'id' });
Survey.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id' });

// User : OnSite = 1 : 1
User.hasOne(OnSite, { foreignKey: 'user_id', sourceKey: 'id', as: 'on_site' });
OnSite.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'id',
  as: 'user',
});

// 모델 DB 객체에 저장
db.User = User;
db.Seat = Seat;
db.Survey = Survey;
db.Play = Play;
db.Schedule = Schedule;
db.OnSite = OnSite;
db.Count = Count;

db.sequelize = sequelize;

module.exports = db;
