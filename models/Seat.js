const { DataTypes } = require('sequelize');

const Seat = (sequelize) => {
  const model = sequelize.define(
    'seat',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '좌석 pri 키',
      },
      row: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '좌석 열',
      },
      number: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: '좌석 번호',
      },
      state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '예약 상태', // false: 대기, true: 확정
      },
      lock: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '잠금 상태', // false: 예약 가능, true: 예약 중
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
    },
    {
      tableName: 'seat',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  return model;
};

module.exports = Seat;
