"use strict";

const tree     = require('../utils/tree');


module.exports = function(sequelize, DataTypes) {
    var Table = sequelize.define("userauth", {
        ref_path: {type: DataTypes.STRING(128), allowNull: false},
        ref_type: {type: DataTypes.STRING(20), allowNull: false}
    }, {
        freezeTableName: true, //选项表示，数据库中的表明与程序中的保持一致，否则数据库中的表名会以复数的形式命名
        tableName: 'iov_user_auths'
    });

    Table.associate = function(models) {

        Table.removeAttribute('id');

        Table.belongsTo(models.user, {
          foreignKey: 'user_id'
        });
    }

    // 查询条件: 匹配权限范围， self+children
    Table.authMatch = function(type, ids) {
        let cond2 = tree.condition(sequelize, ids, {parents: false, self: false, parentsColumn: 'ref_path'});
        return {[Op.and]: [{ref_type: type}, cond2]};
    };


    return Table;
};

