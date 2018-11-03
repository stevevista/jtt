"use strict";


module.exports = function(sequelize, DataTypes) {
    var Alarm = sequelize.define("alarm", {
        plate_no: DataTypes.STRING(20),
        status: DataTypes.INTEGER,
        type: DataTypes.INTEGER,
        child_type: DataTypes.INTEGER,
        in_out: DataTypes.INTEGER,
        time_span: DataTypes.INTEGER,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        latitude1: DataTypes.FLOAT,
        longitude1: DataTypes.FLOAT,
        speed: DataTypes.INTEGER,
        fuel: DataTypes.INTEGER,
        board_speed: DataTypes.INTEGER,
        mileage: DataTypes.INTEGER,
        deleted: DataTypes.BOOLEAN,
        start_time: DataTypes.DATE,
        end_time: DataTypes.DATE,
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        owner: DataTypes.STRING(20),
        opinion: DataTypes.STRING(255) //处理意见
    }, {
        tableName: 'iov_alarm_record',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Alarm.associate = function(models) {
        Alarm.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });

        Alarm.belongsTo(models.region, {
            foreignKey: 'region_id'
        });
    }


    Alarm.prototype.toJsonFull = function() {
        return {
            id: this.id,
            simno: this.sim_no, 
            plateno: this.plate_no,
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
            platecolor: this.terminal.plate_color,
            model: this.terminal.model,
            rname: this.region? this.region.name : '',
            cname: this.terminal.regionCode
        }
    }

    return Alarm;
}
