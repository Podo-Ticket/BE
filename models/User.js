const { DataTypes } = require('sequelize');

const User = (sequelize) => {
    const model = sequelize.define(
        'user',
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: '사용자 pri 키',
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '사용자 이름',
            },
            phone_number: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: '사용자 전화번호',
            },
            head_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: '예매 인원',
            },
            state: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: '발권 상태',
            },
        },
        {
            tableName: 'user',
            freezeTableName: true,
            timestamps: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        }
    );
    return model;
};

module.exports = User;