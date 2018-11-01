'use strict'
const config = require('../config')
const logger = require('log4js').getLogger()
const CURRENT_VER = 1

async function modelVersion(db) {
  try {
    const [res] = await db.sequelize.query('SELECT version FROM __model_version__')
    if (res.length) {
      return res[res.length - 1].version
    }
  } catch (e) {
    logger.info('no __model_version__')
  }

  try {
    const qi = db.sequelize.getQueryInterface()
    await qi.describeTable('users')
    return 0
  } catch (e) {
    return -1
  }
}

async function migrate(db) {
  const ver = await modelVersion(db)
  logger.info(`model version = ${ver}`)
  if (ver >= CURRENT_VER) {
    return
  }

  let syncCb
  if (ver >= 0) {
    // backup old table
    const qi = db.sequelize.getQueryInterface()
    qi.renameTable('users', 'users_old')

    syncCb = async () => {
      qi.dropTable('users_old')
    }
  }

  await initializeDb(db, syncCb)
}

async function initializeDb(db, syncCb) {
  await db.sequelize.sync({logging: (log) => logger.info(log), force: false, alter: false})
  if (typeof syncCb === 'function') {
    await syncCb()
  }

  db.__model_version__.create({version: CURRENT_VER})

  logger.info('db initialized!')
}

module.exports = migrate
