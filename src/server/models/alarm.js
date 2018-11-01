"use strict";


module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_alarm', {
      plateNo: {type: DataTypes.STRING(20), allowNull: false},
      status: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
      msg_sn: DataTypes.INTEGER,
      child_type: DataTypes.INTEGER,
      in_out: DataTypes.INTEGER,
      regionId: DataTypes.INTEGER,
      time_span: DataTypes.INTEGER,
      latitude: DataTypes.FLOAT,
      longitude: DataTypes.FLOAT,
      latitude1: DataTypes.FLOAT,
      longitude1: DataTypes.FLOAT,
      driving_time: DataTypes.INTEGER,
      speed: DataTypes.INTEGER,
      eventId: DataTypes.INTEGER,
      fuel: DataTypes.INTEGER,
      direction: DataTypes.INTEGER,
      board_speed: DataTypes.INTEGER,
      altitude: DataTypes.INTEGER,
      mileage: DataTypes.INTEGER,
      deleted: DataTypes.BOOLEAN,
      start_time: DataTypes.DATE,
      end_time: DataTypes.DATE,
      owner: DataTypes.STRING(20),
      opinion: DataTypes.STRING(255) //处理意见
    }, {
    tableName: 'iov_alarm',
    freezeTableName: true,
    timestamps: true
  })

  Table.associate = function(models) {
    Table.belongsTo(models.iov_device, {
      foreignKey: 'simNo'
    })
    Table.belongsTo(models.iov_vehicle, {
      foreignKey: 'vehicleId'
    })
    Table.belongsTo(models.iov_region, {
      foreignKey: 'regionId'
    });
  }

  Table.prototype.toJsonFull = function() {
    return {
        id: this.id,
        simNo: this.simNo, 
        plateNo: this.plateNo,
        status: this.status,
        type: this.type,
        ctype: this.child_type,
        inout: this.in_out,
        btime: this.start_time,
        etime: this.end_time,
        ts: this.time_span,
        region_id: this.region_id,
        lng: +this.longitude,
        lat: +this.latitude,
        lng1: +this.longitude1,
        lat1: +this.latitude1,
        speed: this.speed,
        fuel: this.fuel,
        bspeed: this.board_speed,
        mileage: this.mileage,
        ctime: this.created_date,
        opinion: this.opinion,
        platecolor: this.iov_vehicle.plate_color,
        model: this.iov_vehicle.model,
        rname: this.region? this.region.name : '',
        cname: this.iov_vehicle.regionCode
    }
  }

  return Table
}

