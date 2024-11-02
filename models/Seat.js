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