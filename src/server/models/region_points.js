"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("region_points", {
        type: DataTypes.INTEGER,
        prop: DataTypes.INTEGER,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        width: DataTypes.INTEGER,
        max_drive_time: DataTypes.INTEGER,
        min_drive_time: DataTypes.INTEGER,
        speed_limit: DataTypes.INTEGER,
        speed_limit_time: DataTypes.INTEGER
    }, {
        tableName: 'iov_region_pts'
    })

  Table.associate = function(models) {
    Table.belongsTo(models.iov_region, {
      foreignKey: 'regionId'
    })
  }

  return Table
}
