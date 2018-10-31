"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("media", {
        media_id: DataTypes.INTEGER,
        plate_no: {type: DataTypes.STRING(20), allowNull: false},
        channel: DataTypes.INTEGER,
        type: DataTypes.INTEGER,
        format: DataTypes.INTEGER,
        event_code: DataTypes.INTEGER,
        path: DataTypes.STRING(512),
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        status: DataTypes.INTEGER,
        gps_date: DataTypes.DATE,
        speed: DataTypes.INTEGER,
        direction: DataTypes.INTEGER,
        altitude: DataTypes.INTEGER,
        alarm_status: DataTypes.INTEGER
    }, {
        tableName: 'iov_media'
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
