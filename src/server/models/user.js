"use strict";
const Sequelize = require('sequelize')
const _         = require('lodash')
const tree = require('../utils/tree')

const Op = Sequelize.Op

const LEVEL_SUPER = 0;
const LEVEL_MASTER = 1;
const LEVEL_NORMAL = 100;

const AUTH_TYPE_LIST = ['group', 'menu', 'instruction'];


module.exports = function(sequelize, DataTypes) {

  const Table = sequelize.define('iov_user', {
    username: {type: DataTypes.STRING(32), unique: true, allowNull: false},
    password: DataTypes.STRING(120),
    creator: DataTypes.STRING(32),
    type: DataTypes.STRING(50),
        auth_level: { type: DataTypes.INTEGER, defaultValue: LEVEL_NORMAL, allowNull: false },
        enabled: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },//是否可用
        cn_name: DataTypes.STRING(32),//中文名
        due_date:DataTypes.DATE, //到期时间
        mobile_phone: DataTypes.STRING(25), //电话
        home_phone: DataTypes.STRING(25), //家庭电话
        address: DataTypes.STRING(120), //住址
         //创建时间
        email: DataTypes.STRING(120), //邮箱地址
        describe: DataTypes.STRING(255), //描述
        login_date: DataTypes.DATE, //登录时间
        ip: DataTypes.STRING(120), //用户机器IP
        login_type: { type: DataTypes.STRING(20), defaultValue: 'WEB', allowNull: false }, //登录方式 (需要数据库字段，当前只有网页登录,手机登录等)
        version: { type: DataTypes.STRING(120), defaultValue: '', allowNull: false } //客户版本号(需要数据库字段，但当前为空)
  }, {
    tableName: 'iov_user',
    freezeTableName: true,
    timestamps: true
  })


    Table.associate = function(models) {

        Table.hasMany(models.iov_user_auths, {
            foreignKey: 'user_id'
        });

        Table.hasMany(models.iov_user_menus, {
            foreignKey: 'user_id'
        });
    }

    /**
     * 权限规则
     */
    Table.prototype.isLocalMaster = function() {
        return (this.auth_level != null && this.auth_level <= LEVEL_MASTER);
    }

    Table.prototype.isSuperMaster = function() {
        return (this.auth_level != null && this.auth_level === LEVEL_SUPER);
    }

    /**
     * 获取用户权限地图
     * {
     *    group: [...],
     *    menu: [...]
     * }
     * 
     * local master 拥有除 group 之外的最高权限
     */
  Table.prototype.getAuths = async function(t) {

    if (this.auths) {
      return this.auths
    }

    const auths = {}

    if (this.isLocalMaster()) {
      AUTH_TYPE_LIST.forEach(r => {
        auths[r] = [tree.treeId([])]
      })

      if (this.isSuperMaster()) {
        this.auths = auths
        return auths
      }

      delete auths['group']
    }

    const out = await this.getUserauths({
      attributes: ['ref_path', 'ref_type'],
      where: {ref_type: {$notIn: Object.keys(auths)}},
      transaction: t
    })
    
    out.forEach(r => {
      (auths[r.ref_type] || (auths[r.ref_type]=[])).push(tree.treeId(r.ref_path))
    })
    this.auths = auths
    return auths
  }


    /**
     * 是否有树形结构权限
     */
    Table.prototype.hasAuth = function(type, id, full) {

        let collect = this.auths && this.auths[type];
        if (!collect) {
            return false;
        }

        if (id == null) {
            id = tree.treeId([]);
        }

        return id.isChildOf(collect, full);
    }

    Table.prototype.maxAuth = function(type, id) {

        let collect = (this.auths && this.auths[type]) || [];
        let r;

        for (let i=0; i<collect.length; i++) {
            let pid = collect[i];
            if (pid.eq(id))
                r = 0;
            else if (id.isChildOf(pid))
                return 1;
            else if (pid.isChildOf(id)) {
                if (r !== 0) {
                    r = -1;
                }
            }
        }
        
        return r;
    }


    Table.prototype.toSimpleObject = function() {
        return {
            id: this.id,
            username: this.username,
            creator: this.creator,
            auth_level: this.auth_level,
            enabled: this.enabled,
            cdate: this.createdAt,

            cn_name: this.cn_name,
            due_date: this.due_date,
            mobile_phone: this.mobile_phone,
            home_phone: this.home_phone,
            address: this.address,
            email: this.email,
            describe: this.describe,
            login_date: this.login_date,
            ip: this.ip,
            login_type: this.login_type,
            version: this.version,
            type: this.type
        };
    }

    Table.prototype.getFormatted = function() {

        return this.getAuths().then((auths)=> {

            let authlists = {};
            Object.keys(auths).forEach(k=> {
                authlists[k] = auths[k].map(r=> r.id);
            });
            return {
                id: this.id,
                username: this.username,
                creator: this.creator,
                auth_level: this.auth_level,
                enabled: this.enabled,
                cdate: this.createdAt,

                cn_name: this.cn_name,
                due_date: this.due_date,
                mobile_phone: this.mobile_phone,
                home_phone: this.home_phone,
                address: this.address,
                email: this.email,
                describe: this.describe,
                login_date: this.login_date,
                ip: this.ip,
                login_type: this.login_type,
                version: this.version,
                type: this.type,
                auths: authlists
            };
        });
    }

    Table.prototype.getFormatted2 = function(models, type) {

        let types;
        if (type && type !== 'all')
            types = [type];

        return this.getAuthsTree(models, types).then((tree)=> {
            let authlists = {};
            Object.keys(this.auths).forEach(k=> {
                authlists[k] = this.auths[k].map(r=> r.id);
            });

            return {
                id: this.id,
                username: this.username,
                creator: this.creator,
                auth_level: this.auth_level,
                enabled: this.enabled,
                cdate: this.createdAt,

                cn_name: this.cn_name,
                due_date: this.due_date,
                mobile_phone: this.mobile_phone,
                home_phone: this.home_phone,
                address: this.address,
                email: this.email,
                describe: this.describe,
                login_date: this.login_date,
                ip: this.ip,
                login_type: this.login_type,
                version: this.version,
                type: this.type,
                auths: authlists,
                authsTree: tree
            };
        })
    }

    

  Table.prototype.getAuthsTree = async function(models, types) {

    const {iov_device: Device} = models

    types = types || ['terminal', 'menu', 'instruction']
    let names = []

    if (!this.authsTree) {
      this.authsTree = {}
    }

    const auths = await this.getAuths()
    const tasks = []

    types.forEach(t => {
      const name = (t === 'terminal') ? 'group' : t
      if (this.authsTree[name] === null) {
        const prop = {}

        if (name === 'group') {
          prop.include = [{
            model: Device
          }]

          prop.where = {[Op.and]: []}
          prop.createNode = (r)=> {
            let n = r.asNode()
            n.authed = this.maxAuth('group', r.treeId())
            if (r.terminal)
              n.name = r.terminal.plateNo
            return n
          }

          if (t === 'group') {
            prop.where[Op.and].push({type: {[Op.ne]: 'TERM'}});
          }
          // 除非单独设定，不显示具体车辆
          //let ids = authGroups.map(r=> r.id);
          //prop.where.$and.push({$or: [{id: {$in:ids}}, {type: {[Op.ne]: 'TERM'}}]})
        } else {
          prop.createNode = (r)=> {
            let n = r.asNode()
            n.authed = this.maxAuth(t, r.treeId())
            return n
          }

          names.push(name)
          tasks.push(models[name].asTree(auths[name], prop))
        }
      }
    })

    const rows = await Promise.all(tasks)
    names.forEach((t, i) => {
      this.authsTree[t] = rows[i].roots
    })
    return this.authsTree
  }

    Table.prototype.updateAuth = function(models, newauths, reqUser) {

        let UserAuth = models.iov_user_auths;

        return sequelize.transaction(t=> {

            // 先获取旧权限
            return this.getAuths(t).then((oldauths)=> {

                let records = [];
                let orRemoves = [];

                Object.keys(newauths).forEach(k=> {

                    let news = newauths[k];
                    let old = oldauths[k];

                    // 过滤掉自身重复, 如父节点已经包含子节点
                    news = news.filter(id=> !id.isChildOf(news, true));

                    if (old) {
                    
                        // 其他的被删除
                        let collect = old.filter(id=> _.find(news, r=> r.eq(id)) == null && 
                                                                reqUser.hasAuth(k, id));
                        if (collect.length > 0) {
                            orRemoves.push(UserAuth.authMatch(k, collect))
                        }

                        // 删除重复的
                        news = news.filter(id=> _.find(old, r=> r.eq(id)) == null);
                    }

                    // 过滤掉自身重复, 如父节点已经包含子节点
                    news.forEach(id=> {
                        records.push({user_id: this.id, ref_type: k, ref_path: id.stringfy()});
                    });
                });

                if (orRemoves.length === 0)
                    return UserAuth.bulkCreate(records, {transaction: t});

                return UserAuth.destroy({
                    where: {
                        user_id: this.id,
                        $or: orRemoves
                    },
                    transaction: t
                }).then(()=> {
                    return UserAuth.bulkCreate(records, {transaction: t});
                })
            });
        });
    };

    Table.prototype.destroySelf = function(models) {
        return models.iov_user_auths.destroy({where: {user_id: this.id}}).then(()=> {
            return models.iov_user_menus.destroy({where: {user_id: this.id}}).then(()=> {
                return this.destroy()
            })
        })
    }

    return Table;
};
