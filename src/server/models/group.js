"use strict";

const tree     = require('../utils/tree');

module.exports = function(sequelize, DataTypes) {
	const Table = sequelize.define('iov_group', {
    	parents: {type: DataTypes.STRING(128), allowNull: false},
        name: {type: DataTypes.STRING(20), allowNull: false},
        deletes: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    type: DataTypes.STRING(20),
        deleted: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
        owner: DataTypes.STRING(20)
  }, {
      tableName: 'iov_group',
      freezeTableName: true,
      timestamps: true,
		 underscored: true,
    })

    Table.associate = function(models) {

    Table.hasOne(models.iov_vehicle, {
      foreignKey: 'groupId'
    })
  }



    Table.prototype.asNode = function() {
      return {id: this.id, name: this.name, type: this.type}
    }

    tree.bindTable(sequelize, Table);

    return Table;
};
