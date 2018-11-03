"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("media", {

        plate_no: DataTypes.STRING(20),
        channel: DataTypes.INTEGER,
        type: DataTypes.INTEGER,
        format: DataTypes.INTEGER,
        event_code: DataTypes.INTEGER,
        path: DataTypes.STRING(512),
        media_id: DataTypes.INTEGER,
        latitude: DataTypes.FLOAT,
        longitude: DataTypes.FLOAT,
        status: DataTypes.INTEGER,
        gps_date: DataTypes.DATE,
        created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
    }, {
        tableName: 'iov_media',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Table.associate = function(models) {
        Table.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });
    }

    return Table;
}
