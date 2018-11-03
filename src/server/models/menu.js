"use strict";

const tree     = require('../utils/tree');


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("menu", {
        parents: {type: DataTypes.STRING(128), allowNull: false},
        name: {type: DataTypes.STRING(20), allowNull: false},
        deletes: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        url: DataTypes.STRING(128),
        icon: DataTypes.STRING(20)
    }, {
        tableName: 'iov_menus',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
    });

    Table.prototype.asNode = function() {
        return {id: this.id, name: this.name}
    }

    tree.bindTable(sequelize, Table);

    return Table;
};
