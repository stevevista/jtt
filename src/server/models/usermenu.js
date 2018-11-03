"use strict";

const tree     = require('../utils/tree');


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("usermenu", {
        sort_order: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        tableName: 'iov_user_menus'
    });

    Table.associate = function(models) {

        Table.removeAttribute('id');

        Table.belongsTo(models.user, {
          foreignKey: 'user_id'
        });

        Table.belongsTo(models.menu, {
          foreignKey: 'menu_id'
        });
    }

    return Table;
};

