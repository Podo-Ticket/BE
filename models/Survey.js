const { DataTypes } = require('sequelize');

const Survey = (sequelize) => {
  const model = sequelize.define(
    'survey',
    {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        comment: '서비스 평가 pri 키',
      },
      question: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '질문 번호',
      },
      answer: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '서비스 평가 답변', // 0: 안 함, 1: 더 귀찮아졌음, 2: 비슷해요, 3: 더 편해졌어요
      },
    },
    {
      tableName: 'survey',
      freezeTableName: true,
      timestamps: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  return model;
};

module.exports = Survey;
