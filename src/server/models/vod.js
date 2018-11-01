"use strict";


module.exports = function(sequelize, DataTypes) {
    var Vod = sequelize.define("vod", {
        name: {type: DataTypes.STRING(260), allowNull: false},
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    }, {
        tableName: 'iov_vod',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false,
        classMethods: {
            associate: function(models) {
                Vod.hasMany(models.vodreq, {
                    foreignKey: 'vod_id'
                });
            }
        }
    });

    return Vod;
}
