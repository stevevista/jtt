"use strict";


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define('iov_terms_driver', {
        name: DataTypes.STRING(30),
        is_iccard: { type: DataTypes.BOOLEAN, defaultValue: false },
        begin_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        begin_addres: DataTypes.STRING(200),
        end_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        end_addres: DataTypes.STRING(200),
        begin_latitude: DataTypes.FLOAT,
        begin_longitude: DataTypes.FLOAT,
        end_latitude: DataTypes.FLOAT,
        end_longitude: DataTypes.FLOAT,
        acc: DataTypes.INTEGER
    }, {
        tableName: 'iov_terms_driver',
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        timestamps: false
    });
    
    Table.associate = function(models) {
        Table.belongsTo(models.iov_group, {
            foreignKey: 'groupId'
        })
        
        models.iov_driver.hasMany(Table, {
            foreignKey: 'driver_id'
        })
    }

    return Table;
}
