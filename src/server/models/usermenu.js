"use strict"

module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_user_menus', {
    sort_order: {type: DataTypes.INTEGER, allowNull: false}
  }, {
    freezeTableName: true,
    tableName: 'iov_user_menus',
    timestamps: false
  })

  Table.associate = function(models) {

    Table.removeAttribute('id')

    Table.belongsTo(models.iov_user, {
      foreignKey: 'userId'
    })

    Table.belongsTo(models.iov_menus, {
      foreignKey: 'menuId'
    })
  }

  return Table
}
