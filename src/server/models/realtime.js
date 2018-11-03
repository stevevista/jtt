"use strict";


module.exports = function(sequelize, DataTypes) {
    var GPSReal = sequelize.define("realtime", {
        online: DataTypes.BOOLEAN,
        valid: DataTypes.BOOLEAN,
        //sim_no: {type: DataTypes.STRING(20), primaryKey: true, unique: true, allowNull: false},
        plate_no: DataTypes.STRING(20),
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
        gps_date: DataTypes.DATE,
        update_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        live: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        content: DataTypes.STRING(255),
        live1: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        content1: DataTypes.STRING(255),
        live2: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        content2: DataTypes.STRING(255),
        live3: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
        content3: DataTypes.STRING(255)
    }, {
        tableName: 'iov_gps_real',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    GPSReal.associate = function(models) {
        GPSReal.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });
    }

    return GPSReal;
}
