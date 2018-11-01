"use strict"

module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_device_status', {
    simNo: {type: DataTypes.STRING(12), primaryKey: true},
    valid: DataTypes.BOOLEAN,
    plateNo: DataTypes.STRING(20),
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
    updateDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
    online: DataTypes.BOOLEAN,
    live: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    content: DataTypes.STRING(255),
    live1: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    content1: DataTypes.STRING(255),
    live2: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    content2: DataTypes.STRING(255),
    live3: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    content3: DataTypes.STRING(255)
  }, {
    tableName: 'iov_device_status',
    freezeTableName: true,
    timestamps: false
  })

  Table.associate = function(models) {
    Table.belongsTo(models.iov_device, {
      foreignKey: 'simNo'
    })
  }

  return Table
}
