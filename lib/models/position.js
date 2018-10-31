"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("position", {
        plate_no: {type: DataTypes.STRING(20), allowNull: false},
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
        valid: DataTypes.BOOLEAN
    }, {
        tableName: 'iov_position'
    })

    Table.associate = function(models) {
        Table.belongsTo(models.device, {
            foreignKey: 'sim_no'
        });
        Table.belongsTo(models.vehicle, {
            foreignKey: 'vehicle_id'
        });
    }

    return Table;
}
