const { DataTypes } = require('sequelize');

const OnSite = (sequelize) => {
    const model = sequelize.define(
        'on_site',
        {
            id: {
                type: DataTypes.BIGINT,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                comment: '현장 예매 pri 키',
            },
            on_site: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: '현장 예매 여부',
            },
            approve: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: '현장 예매 수락 여부',
            },
        },{
            tableName: 'on_site',
            freezeTableName: true,
            timestamps: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        }
    );
    return model;
};

module.exports = OnSite;