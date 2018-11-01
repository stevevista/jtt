"use strict";


module.exports = function(sequelize, DataTypes) {
    var Rcode = sequelize.define("regcode", {
        code: { type: DataTypes.STRING(6), allowNull: false },
        code_name: { type: DataTypes.STRING(60), allowNull: false }
    }, {
        tableName: 'iov_GBRegionCodes',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    });

    Rcode.associate = function(models) {
        Rcode.removeAttribute('id');
    };


    return Rcode;
}
