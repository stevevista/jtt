
'use strict'
const Sequelize = require('sequelize')
const _         = require('lodash')

const Op = Sequelize.Op

function treeId(s, childId) {
    let path, id = 0;
    if (typeof(s) === 'string') {
        // .1.2.3. => [1,2,3]
        path = s.split('.')
            .filter(r=> !!r)
            .map(r=> parseInt(r));
    } else {
        if(s===null) path=[];
        else path = s;
    }

    // (parent, id)
    if (typeof(childId) === 'number') {
        path.push(childId);
    }

    if (path.length > 0) {
        id = path[path.length-1];
    }

    return {
        id: id,
        path: path,

        stringfy: function() {
            //  [1,2,3] => .1.2.3.
            let s = this.path.join('.');
            if (s)
                s = '.' + s + '.';
            return s; 
        },

        _isChildOf: function(obj, excludeEqual) {
            if (excludeEqual&& this.eq(obj)) {
                return false;
            }
            if (obj.id === 0) {
                return true;
            }
            return this.path.indexOf(obj.id)>= 0;
        },

        _isParentOf: function(obj) {
            if (this.eq(obj)) {
                return false;
            }
            if (this.id === 0) {
                return true;
            }
            return obj.path.indexOf(this.id)>= 0;
        },

        isChildOfOrEqual: function(obj) {
          if (_.isArray(obj)) {
            return obj.some(authed => this._isChildOf(authed, false))
          }
          return this._isChildOf(obj, false)
        },

        isChildOf: function(obj) {
          if (_.isArray(obj)) {
            return obj.some(authed => this._isChildOf(authed, true))
          }
          return this._isChildOf(obj, true)
        },

        isParentOf: function(obj) {
            if (_.isArray(obj) || obj == null) {
                let r = _.find(obj, authed=> this._isParentOf(authed));
                return r != null;
            }
            return this._isParentOf(obj);
        },

        eq: function(obj) {
            return this.id === obj.id;
        },

        parent: function() {
            let size = this.path.length;
            if (size === 0)
                return treeId([]);
            else    
                return treeId(this.path.slice(0, size-1));
        }
    };
}

/**
 * 生成查询条件
 * 
 *  options：
 *    idColumn = id
 *    parents = false     
 * 
 */



function condition(sequelize, ids, options) {

    ids = ids || [];
    options = _.extend({
        idColumn: 'id',
        parentsColumn: 'parents',
        parents: false,
        children: true,
        self:true
    }, options);

    const col = sequelize.col(options.idColumn);
    const colParents = sequelize.col(options.parentsColumn);

    // 无效查询
    if (ids.length === 0)
        return sequelize.where(col, null);

    // 含有 0 的特殊节点,则不限制查询条件
    let getall = _.find(ids, id=> id.id === 0);
    if (getall != null) {
        if (!options.children) {
            return sequelize.where(col, null);
        }
        return {};
    }

    let or = []
    if (options.parents) {
        let list = _.union.apply(_, ids.map(r=> r.parent().path)); // 父节点
        let cond = sequelize.where(col, {[Op.in]: list});
        or.push(cond);
    }

    if (options.self) {
        or.push(sequelize.where(col, {[Op.in]: ids.map(r=> r.id)})); // 自己
    }

    if (options.children) {
        let cond = sequelize.where(colParents, {[Op.like]: {[Op.any]: ids.map(r=> '%.'+ r.id +'.%')}}) // 子节点
        or.push(cond);
    }

    if (or.length === 1)
        return or[0];
    else 
        return {[Op.or]: or};
}


function keepOrder(list, key, rows, convert) {
    let mapping = {};
    let out = [];

    rows.forEach(r=> {
        mapping[r[key]] = convert.call(r);
    });
    list.forEach(id=> {
        let r = mapping[id];
        if (r != null) {
            out.push(r);
            delete mapping[id];
        }
    });

    Object.keys(mapping).forEach(k=> out.push(mapping[k]));
    return out;
}

function _getPaths(table, ids, order) {
    return table.findAll({
        attributes: ['id', 'parents'],
        where: {deletes: 0, id: {[Op.in]: ids}}
    }).then(rows=> {
        if (order) {
            return keepOrder(ids, 'id', rows, _treeId);
        }
        return rows.map(r=> _treeId.call(r));
    });
}


function _asTree(sequelize, table, ids, options = {}) {

  options = {
    parents: true,
    idColumn: table.name + '.id',
    parentsColumn: table.name + '.parents',
    ...options
  }

  console.log(options)

    let conds = [{deletes: 0}, condition(sequelize, ids, options)]

    if (options.where) {
        conds.push(options.where);
    }

    let queryOpts = {
        where: {[Op.and]: conds},
        order: [['parents'],['id']]
    };

    if (options.attributes) {
        queryOpts.attributes = options.attributes;
    }

    if (options.include) {
        queryOpts.include = options.include;
    }

    if (options.order) {
        //queryOpts.order = queryOpts.order + ',' + options.order;
        queryOpts.order.push(options.order);
    }

    let createNode = options.createNode || ((r)=> r.asNode());
//console.log('----_asTree--0----');
//console.dir(queryOpts);
    return table.findAll(queryOpts).then((rows)=> {
        
        let roots = [];
        let map = {};

        rows.forEach(r=> {
            let pid = _treeId.call(r).parent().id;
            let parent = map[pid];
            // 检查树继承是否完整
            // 如果父节点不存在(被删除)，则此节点无效
            if (parent || pid === 0) {
                let node = createNode(r, parent);
                if (node) {
                    let container = parent ? (parent.children || (parent.children = [])) : roots;
                    container.push(node);
                    map[r.id] = node
                }
            }
        })

        return {roots: roots, map: map}
    })

}


/**
 * 条件：
 *  名字相同
 *  未被删除
 *  不是refid
 *  与parents 存在继承关系
 * 
 */
function _isValidName(table, name, nodeid, refid) {

    let conds = [
            {deletes: 0}, 
            {name: {[Op.iLike]: name}}
        ];

    if (nodeid == null) {
        conds.push({parents: ''});
    } else {
        conds.push({[Op.or]: [
            {parents: {[Op.like]: '%.'+ nodeid.id +'.%'}}, // 子节点
            {id: {[Op.in]: nodeid.path}} // 父节点或自己
        ]});
    }

    if (refid) {
        conds.push({id: {[Op.ne]: refid}});
    }

    return table.count({
        where: {[Op.and]: conds}    
    }).then(c=> {
        return (c === 0);
    })
}


function _treeId() {
    return treeId(this.parents, this.id);
}


function _treeDestroy(models, sequelize) {
    return sequelize.transaction(t=> {
        return this.update({
            deletes: sequelize.literal('"deletes"+1')
        }, {
            transaction: t
        }).then(()=> {
            let UserAuth = models['userauth'];
            let type = this._modelOptions.name.singular;
            return UserAuth.destroy({
                where: UserAuth.authMatch(type, [_treeId.call(this)]),
                transaction: t
            })
        });
	});
}


function _addNode(table, values, parent, options) {
    values = _.extend({
        parents : parent ? parent.treeId().stringfy() : ''
    }, values);

    return table.create(values, options);
}

/**
 * 修剪树, 不符合条件的剪除
 */
function truncate(containers, compare) {

    return containers.filter(r=> {
        if (r.children) {
            let sets = truncate(r.children, compare);
            if (sets.length === 0) {
                delete r.children;
            }
        }

        return (r.children || compare(r));
    });
}


/**
 * 绑定数据库操作
 */
exports.bindTable = function(sequelize, Table) {
    Table.prototype.treeId = _treeId;
    Table.prototype.treeDestroy = function(models) { return _treeDestroy.call(this, models, sequelize); }

    Table.isValidName = _isValidName.bind(null, Table);
    Table.asTree = _asTree.bind(null, sequelize, Table);
    Table.getPaths = _getPaths.bind(null, Table);
    Table.addNode = _addNode.bind(null, Table);
}



exports.truncate = truncate;
exports.treeId = treeId;
exports.condition = condition;
exports.keepOrder = keepOrder;
