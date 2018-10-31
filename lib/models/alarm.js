"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("alarm", {
        plate_no: {type: DataTypes.STRING(20), allowNull: false},
        msg_sn: DataTypes.INTEGER,
        child_type: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        in_out: DataTypes.INTEGER,
        region_id: DataTypes.INTEGER,
        driving_time: DataTypes.INTEGER,
        event_id: DataTypes.INTEGER,
        time_span: DataTypes.INTEGER,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        latitude1: DataTypes.FLOAT,
        longitude1: DataTypes.FLOAT,
        speed: DataTypes.INTEGER,
        direction: DataTypes.INTEGER,
        altitude: DataTypes.INTEGER,
        fuel: DataTypes.INTEGER,
        board_speed: DataTypes.INTEGER,
        mileage: DataTypes.INTEGER,
        start_time: DataTypes.DATE,
        end_time: DataTypes.DATE
    }, {
        tableName: 'iov_alarm'
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
