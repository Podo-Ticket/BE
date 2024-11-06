const { DataTypes } = require('sequelize');

const Schedule = (sequelize) => {
    const model = sequelize.define(
        'schedule',
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: '일정 pri 키',
            },
            date_time: {
                type: DataTypes.DATE,
                allowNull: false,
                comment: '일시',
            },
        },
        {
            tableName: 'schedule',
            freezeTableName: true,
            timestamps: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        }
    );
    return model;
};

module.exports = Schedule;