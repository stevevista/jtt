"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("request", {
        command: DataTypes.STRING(50),
        data: DataTypes.TEXT,
        returned: DataTypes.TEXT,
        error: DataTypes.STRING(512),
        plate_no: {type: DataTypes.STRING(20), allowNull: false},
        status: DataTypes.INTEGER
    }, {
        tableName: 'iov_request'
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
