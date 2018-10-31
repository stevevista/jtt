"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("vehicle", {
        plate_no: {type: DataTypes.STRING(20), unique: true, allowNull: false}
    }, {
        tableName: 'iov_vehicle'
    })

    Table.associate = function(models) {
        Table.hasOne(models.vehicleStatus, {
            foreignKey: 'vehicle_id'
        });
        Table.hasOne(models.device, {
            foreignKey: 'vehicle_id'
        });
    }
    


    return Table;
}
