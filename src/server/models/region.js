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
        speed_limit_time: DataTypes.INTEGER,
        name: DataTypes.STRING(60),
        region_type: DataTypes.STRING(20),
        points: DataTypes.TEXT,
        deleted: DataTypes.BOOLEAN,
        owner: DataTypes.STRING(20)
    }, {
        tableName: 'iov_region'
    })

    Table.associate = function(models) {
    }


    return Table;
}