const { DataTypes } = require('sequelize');

const ReservationFlowTime = (sequelize) => {
  const model = sequelize.define(
    'ReservationFlowTime',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      checkReservationAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      seatSelectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      issuedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'reservation_flow_time',
      timestamps: false,
    }
  );
  return model;
};

module.exports = ReservationFlowTime;
