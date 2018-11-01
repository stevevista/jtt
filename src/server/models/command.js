"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("command", {
        sn: DataTypes.STRING(20),
        cmd: DataTypes.STRING(20),
        cmd_desc: DataTypes.STRING(512),
        cmd_type: DataTypes.INTEGER,
        plateNo: DataTypes.STRING(20),
        status: DataTypes.INTEGER,
        cmd_data: DataTypes.TEXT,
        rsp_data: DataTypes.TEXT,
        user_id: DataTypes.STRING(60),
        update_date: DataTypes.DATE,
        deleted: DataTypes.BOOLEAN,
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        owner: DataTypes.STRING(20),
        media_status: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }
    }, {
        tableName: 'iov_command',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Table.associate = function(models) {
        Table.belongsTo(models.iov_device, {
            foreignKey: 'simNo'
        });
    }

    return Table;
}
