const { DataTypes } = require('sequelize');

const Reservation = (sequelize) => {
    const model = sequelize.define(
        'reservation',
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: '예약 pri 키',
            },
            status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                comment: '예약 상태',
            },
        },
        {
            tableName: 'reservation',
            freezeTableName: true,
            timestamps: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        }
    );
    return model;
};

module.exports = Reservation;