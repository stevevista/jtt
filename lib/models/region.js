"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("region", {
        type: DataTypes.INTEGER,
        prop: DataTypes.INTEGER,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        latitude1: DataTypes.FLOAT,
        longitude1: DataTypes.FLOAT,
        radius: DataTypes.INTEGER,
        start_time: DataTypes.DATE,
        end_time: DataTypes.DATE,
        speed_limit: DataTypes.INTEGER,
        speed_limit_time: DataTypes.INTEGER
    }, {
        tableName: 'iov_region'
    })

    Table.associate = function(models) {
    }


    return Table;
}
