const { DataTypes } = require('sequelize');

const Play = (sequelize) => {
  const model = sequelize.define(
    'play',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '공연 pri 키',
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '공연 제목',
      },
      poster: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '공연 포스터',
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '공연 장소',
      },
      running_time: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '관람 시간',
      },
    },
    {
      tableName: 'play',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  );
  return model;
};

module.exports = Play;
