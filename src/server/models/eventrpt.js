"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define('iov_event_report', {
        simNo: DataTypes.STRING(20),
        plateNo: DataTypes.STRING(20),
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
    }, {
        tableName: 'iov_event_report',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false,
    });

    Table.associate = function(models) {
        Table.belongsTo(models.iov_event, {
            foreignKey: 'eventId'
        });
    };

    return Table;
}
