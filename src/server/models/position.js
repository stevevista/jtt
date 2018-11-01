"use strict";


module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_position', {
    plateNo: {type: DataTypes.STRING(20), allowNull: false},
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        speed: DataTypes.INTEGER,
        direction: DataTypes.INTEGER,
        altitude: DataTypes.INTEGER,
        alarm_status: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        fuel: DataTypes.INTEGER,
        board_speed: DataTypes.INTEGER,
        mileage: DataTypes.INTEGER,
        temperature: DataTypes.FLOAT,
        gpsDate: DataTypes.DATE,
        valid: DataTypes.BOOLEAN
    }, {
        tableName: 'iov_position'
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
