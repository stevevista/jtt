"use strict"

const tree     = require('../utils/tree')

module.exports = function(sequelize, DataTypes) {
  const Table = sequelize.define('iov_user_auths', {
    ref_path: {type: DataTypes.STRING(128), allowNull: false},
    ref_type: {type: DataTypes.STRING(20), allowNull: false}
  }, {
    freezeTableName: true,
    tableName: 'iov_user_auths',
    timestamps: false
  })

  Table.associate = function(models) {

    Table.removeAttribute('id')

    Table.belongsTo(models.iov_user, {
      foreignKey: 'userId'
    })
  }

  // 查询条件: 匹配权限范围， self+children
  Table.authMatch = function(ref_type, ids) {
    let cond2 = tree.condition(sequelize, ids, {parents: false, self: false, parentsColumn: 'ref_path'})
    return {$and: [{ref_type}, cond2]}
  }

  return Table
}
