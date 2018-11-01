"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define('iov_media', {
        mediaId: DataTypes.INTEGER,
        plateNo: {type: DataTypes.STRING(20), allowNull: false},
        channel: DataTypes.INTEGER,
        type: DataTypes.INTEGER,
        format: DataTypes.INTEGER,
        event_code: DataTypes.INTEGER,
        path: DataTypes.STRING(512),
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        status: DataTypes.INTEGER,
        gpsDate: DataTypes.DATE,
        speed: DataTypes.INTEGER,
        direction: DataTypes.INTEGER,
        altitude: DataTypes.INTEGER,
        alarm_status: DataTypes.INTEGER
    }, {
        tableName: 'iov_media'
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
