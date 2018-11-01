"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define('iov_request', {
        command: DataTypes.STRING(50),
        data: DataTypes.TEXT,
        returned: DataTypes.TEXT,
        error: DataTypes.STRING(512),
        plateNo: {type: DataTypes.STRING(20), allowNull: false},
        status: DataTypes.INTEGER
    }, {
        tableName: 'iov_request'
    })

  Table.associate = function(models) {
    Table.belongsTo(models.iov_device, {
      foreignKey: 'simNo'
    })
    Table.belongsTo(models.iov_vehicle, {
      foreignKey: 'vehicleId'
    })
  }

  return Table
}
