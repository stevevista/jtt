"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("term_region", {
        plate_no: DataTypes.STRING(20),
        region_id: { type: DataTypes.INTEGER, defaultValue: DataTypes.NOW, allowNull: false },
        region_type: DataTypes.STRING(20),
        points: DataTypes.TEXT,
        update_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false }
    }, {
        tableName: 'iov_term_region',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    })

    Table.associate = function(models) {
        Table.removeAttribute('id');
        Table.belongsTo(models.terminal, {
            foreignKey: 'sim_no'
        });
    }

    return Table;
}
