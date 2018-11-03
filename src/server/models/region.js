"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("region", {
        name: DataTypes.STRING(60),
        region_type: DataTypes.STRING(20),
        points: DataTypes.TEXT,
        deleted: DataTypes.BOOLEAN,
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        owner: DataTypes.STRING(20)
    }, {
        tableName: 'iov_region',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })


    return Table;
}
