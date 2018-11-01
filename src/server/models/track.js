"use strict";


module.exports = function(sequelize, DataTypes) {
    var Track = sequelize.define("track", {
        command_id: DataTypes.INTEGER,
        valid: DataTypes.BOOLEAN,
        plateNo: DataTypes.STRING(20),
        plate_color: DataTypes.INTEGER,
        pos_encrypt: DataTypes.INTEGER,
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
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
    }, {
        tableName: 'iov_positions',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Track.associate = function(models) {
        Track.belongsTo(models.iov_device, {
            foreignKey: 'simNo'
        });
    }

    return Track;
}
