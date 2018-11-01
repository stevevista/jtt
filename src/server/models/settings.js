"use strict";


module.exports = function(sequelize, DataTypes) {

    let Table = sequelize.define("syssettings", {
        type: {type: DataTypes.INTEGER, unique: true, allowNull: false},//类型，1：多媒体，
        content: DataTypes.TEXT,//内容
        name: DataTypes.STRING(32),//名称
        describe: DataTypes.STRING(255), //描述
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    }, {
        tableName: 'iov_sys_settings',
        freezeTableName: true //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
    });


    Table.prototype.toJsonFull = function() {
        return {
            id: this.id,
            type: this.type,
            content: this.content,
            name: this.name,
            desc: this.describe
        };
    }


    return Table;
};
