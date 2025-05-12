const DataTypes = require('sequelize').DataTypes;

const Count = (sequelize) => {
  const count = sequelize.define(
    'count',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '조회 수 pri 키',
      },
      mainCnt: {
        type: DataTypes.INTEGER,
        defaultValue: '0',
        comment: '메인 페이지 조회 수',
      },
      pickCnt: {
        type: DataTypes.INTEGER,
        defaultValue: '0',
        comment: '좌석 선택 페이지 조회 수',
      },
      ticketingCnt: {
        type: DataTypes.INTEGER,
        defaultValue: '0',
        comment: '발권 신청 페이지 조회 수',
      },
      infoCnt: {
        type: DataTypes.INTEGER,
        defaultValue: '0',
        comment: '티켓 정보 페이지 조회 수',
      },
      reservationCnt: {
        type: DataTypes.INTEGER,
        defaultValue: '0',
        comment: '현장 예매 페이지 조회 수',
      },
    },
    {
      tableName: 'count',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  );
  return count;
};

module.exports = Count;
