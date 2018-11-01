"use strict";


module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_vehicle', {
    plateNo: {type: DataTypes.STRING(20), unique: true, allowNull: false},
    termNo: DataTypes.STRING(20),
    manufacturerCode: DataTypes.STRING(10),
    model: DataTypes.STRING(10),
        plate_color: DataTypes.INTEGER,
        regionCode: DataTypes.STRING(6),
        deleted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },

        dep_id: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
        owner: DataTypes.STRING(20),
        register_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
        registered: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        
        driver: DataTypes.STRING(20),
        type: DataTypes.INTEGER,
        industry: DataTypes.INTEGER,
        load: DataTypes.INTEGER,
        run_line: DataTypes.STRING(255),
        init_time: { type: DataTypes.INTEGER, defaultValue: 0},
        init_mileage: DataTypes.INTEGER,
        mileage_correct: DataTypes.FLOAT,
    oyster_sauce: DataTypes.INTEGER,
    remark: DataTypes.STRING(255),
    remark2: DataTypes.STRING(255),
    checkcode: { type: DataTypes.STRING(6), defaultValue: '123456', allowNull: false }
  }, {
    tableName: 'iov_vehicle',
    freezeTableName: true,
    timestamps: true
  })

  Table.associate = function(models) {
    Table.hasOne(models.iov_device, {
      foreignKey: 'vehicleId'
    })
    Table.belongsTo(models.iov_group, {
      foreignKey: 'groupId'
    })
    Table.hasMany(models.iov_terms_driver, {
      foreignKey: 'vehicleId'
    })
  }

  return Table
}
