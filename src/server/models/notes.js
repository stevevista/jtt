"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("notes", {
        status: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false }, //流程状态[0,新消息(缺省)；1,已推送]
        sender: DataTypes.STRING(100),   //发送者
        receiver: DataTypes.STRING(100), //接收者 可能是广播（空）
        type: { type: DataTypes.INTEGER, defaultValue: 0}, //类别 [ 1，多媒体；其他待补充]
        sub_type: { type: DataTypes.INTEGER, defaultValue: 0}, //子类别[10，多媒体直播；11，多媒体服务端主动上报]
        content: DataTypes.TEXT,  // 内容
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }, //时间
        update_date: DataTypes.DATE,
        remake: DataTypes.STRING(255)
    }, {
        tableName: 'iov_notes',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Table.associate = function(models) {
        Table.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });
    }

    return Table;
}
