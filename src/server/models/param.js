"use strict";


module.exports = function(sequelize, DataTypes) {
    var Param = sequelize.define("param", {
        param_id: { type: DataTypes.INTEGER, allowNull: false },
        dword_val: DataTypes.INTEGER,
        string_val: DataTypes.STRING(255)
    }, {
        tableName: 'iov_term_params',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    });

    Param.associate = function(models) {
        Param.removeAttribute('id');
        Param.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });
    };

    return Param;
}

