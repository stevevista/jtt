"use strict";


module.exports = function(sequelize, DataTypes) {

    let Table = sequelize.define("reginfo", {
        phone: {type: DataTypes.STRING(32), unique: true, allowNull: false},//电话
        imei: {type: DataTypes.STRING(32), unique: true, allowNull: false},//IMEI
        password: DataTypes.STRING(28),//密码
        cname: DataTypes.STRING(32),//中文名
        email: DataTypes.STRING(120), //邮箱地址
        status: { type: DataTypes.STRING(40), defaultValue: '待确定', allowNull: false }, //流程状态[待确定，已确定，已拒绝]
        registered: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },//是否已注册[false｜true]
        describe: DataTypes.STRING(255), //描述[如拒绝时，填写拒绝原因]
    }, {
        tableName: 'iov_reg_info',
        freezeTableName: true //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
    });


    Table.prototype.toJsonFull = function() {
        return {
            id: this.id,
            phone: this.phone,
            imei: this.imei,
            pwd: this.password,
            cname: this.cname,
            email: this.email,
            cdate: this.createdAt,
            status: this.status,
            reg: this.registered,
            desc: this.describe
        };
    }


    return Table;
};
