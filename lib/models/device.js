"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("device", {
        sim_no: {type: DataTypes.STRING(12), primaryKey: true}
    }, {
        tableName: 'iov_device'
    })

    Table.associate = function(models) {
        Table.belongsTo(models.vehicle, {
            foreignKey: 'vehicle_id'
        });
    }


    return Table;
}
