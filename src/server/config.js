'use strict'
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const yaml = require('js-yaml')
const cluster = require('cluster')
const log4js = require('log4js')
const ms = require('ms')

let workDir = process.cwd()
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--work-dir') {
    workDir = process.argv[i + 1]
    break
  }
}

function requireJs (path) {
  return yaml.safeLoad(fs.readFileSync(path, 'utf8'))
}

const configDir = path.join(workDir, 'config')
const basConfigPath = path.join(configDir, 'base.yml')
const envConfigPath = path.join(configDir, process.env.NODE_ENV + '.yml')

let config = {
  configDir,
  tmpdir: 'tmp',
  ssldir: 'ssl',
  ssl: true,
  session: {
    maxAge: 24 * 60 * 60 * 1000
  },
  database: {
    host: 'localhost',
    dialect: 'sqlite',
    // operatorsAliases: false
  },
  appLogFilename: 'jtt808.log',
  jtt808: {
    heartBeatInterval: 600000
  }
}

if (!fs.existsSync(basConfigPath)) {
  console.error(`Missing config file: ${basConfigPath}`)
  process.exit(1)
}

config = _.merge(config, requireJs(basConfigPath))
if (fs.existsSync(envConfigPath)) {
  config = _.merge(config, requireJs(envConfigPath))
}

function resolvePath (obj, key, basedir) {
  if (obj && key in obj) {
    if (obj[key][0] !== '/') {
      obj[key] = path.join(basedir, obj[key])
    }
  }
}

if (typeof config.session.maxAge === 'string') {
  config.session.maxAge = ms(config.session.maxAge)
}

resolvePath(config.database, 'storage', workDir)
resolvePath(config, 'appLogFilename', workDir)
resolvePath(config, 'tmpdir', workDir)
resolvePath(config, 'ssldir', workDir)

// app log configuration
const logConfig = {
  appenders: {
    console: {
      type: 'console'
    },
    trace: {
      type: 'file',
      filename: config.appLogFilename,
      maxLogSize: config.appLogSize
    }
  },
  categories: {
    default: {
      appenders: ['console', 'trace'],
      level: config.appLogLevel
    }
  }
}

// init logger
log4js.configure(logConfig)

// ssl config
if (config.ssl) {
  if (fs.existsSync(config.ssldir)) {
    let key
    let cert
    for (const f of fs.readdirSync(config.ssldir)) {
      const ext = path.extname(f)
      if (ext === '.crt' || ext === '.pem') {
        cert = fs.readFileSync(path.join(config.ssldir, f))
      } else if (ext === '.key') {
        key = fs.readFileSync(path.join(config.ssldir, f))
      }
    }
    if (key && cert) {
      config.sslOption = {key, cert}
    }
  }
}

// init storage
if (cluster.isMaster) {
  if (!fs.existsSync(config.tmpdir)) {
    try {
      fs.mkdirSync(config.tmpdir)
    } catch (e) {
      console.error('cannot initialize tmpdir', e.message)
      process.exit(1)
    }
  }
}

module.exports = config
