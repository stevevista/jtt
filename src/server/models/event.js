"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("event", {
        content: {type: DataTypes.TEXT, allowNull: false},
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    }, {
        tableName: 'iov_event',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    });

    Table.associate = function(models) {
        Table.hasMany(models.eventrpt, {
            foreignKey: 'event_id'
        });
    };

    return Table;
}
