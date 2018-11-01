'use strict'
const cluster = require('cluster')
const Sequelize = require('sequelize')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const logger = require('log4js').getLogger()

const defines = []

const files = fs.readdirSync(__dirname)

for (const f of files) {
  if (f === 'index.js' || f === 'migration.js') {
    continue
  }

  const define = require(path.join(__dirname, f))
  defines.push(define)
}

const db = {}
const cfg = config.database
const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password,
  {
    ...cfg,
    logging: sql => logger.info(sql)
  })

function ModelVersion(sequelize, DataTypes) {
  const db = sequelize.define('__model_version__', {
    version: {type: DataTypes.INTEGER, primaryKey: true}
  }, {
    tableName: '__model_version__',
    freezeTableName: true,
    timestamps: true
  })
  
  return db
}

function importModels(defArray) {
  for (const def of defArray) {
    if (typeof def === 'function') {
      const model = def(sequelize, Sequelize.DataTypes)
      db[model.tableName] = model
    } else {
      importModels(def)
    }
  }
}

db['__model_version__'] = ModelVersion(sequelize, Sequelize.DataTypes)
importModels(defines)

Object.keys(db).forEach(modelName => {
  const model = db[modelName]
  sequelize.importCache[modelName] = model
  if ('associate' in model) {
    model.associate(db)
  }
})

db.sequelize = sequelize

if (cluster.isMaster) {
  require('./migration')(db)
}

module.exports = db
