"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("vehicleStatus", {
        vehicle_id: {type: DataTypes.INTEGER, primaryKey: true},
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
        online: DataTypes.BOOLEAN
    }, {
        tableName: 'iov_vehicle_status'
    })

    Table.associate = function(models) {
        Table.belongsTo(models.vehicle, {
            foreignKey: 'vehicle_id'
        });
    }


    return Table;
}
