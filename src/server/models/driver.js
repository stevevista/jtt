"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("driver", {
        name: {type: DataTypes.STRING(32), allowNull: false},
        //group_id: DataTypes.INTEGER,
        iccard: {type: DataTypes.STRING(20), unique: true, allowNull: false},//从业资格证编码
        phone: DataTypes.STRING(20),
        authority: DataTypes.STRING(255),   //发证机构名称
        validity: DataTypes.STRING(10),     //证件有效期 xxxx-xx-xx
        remark: DataTypes.STRING(255),
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    }, {
        tableName: 'iov_driver',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    });

    Table.associate = function(models) {
        Table.belongsTo(models.group, {
            foreignKey: 'group_id'
        });
    }

    return Table;
}
