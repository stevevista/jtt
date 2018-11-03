"use strict";

const tree     = require('../utils/tree');

module.exports = function(sequelize, DataTypes) {
	var Table = sequelize.define("group", {
    	parents: {type: DataTypes.STRING(128), allowNull: false},
        name: {type: DataTypes.STRING(20), allowNull: false},
        deletes: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        is_terminal: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        deleted: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        owner: DataTypes.STRING(20)
    }, {
        tableName: 'iov_department',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false,
		 underscored: true,
    });

    Table.associate = function(models) {

        Table.hasOne(models.terminal, {
            foreignKey: 'group_id'
        });
    }



    Table.prototype.asNode = function() {
        return {id: this.id, name: this.name, is_terminal: this.is_terminal}
    }

    tree.bindTable(sequelize, Table);

    return Table;
};

