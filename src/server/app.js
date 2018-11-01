'use strict'
const http = require('http')
const https = require('https')
const path = require('path')
const cluster = require('cluster')
const Koa = require('koa')
const koaBody = require('koa-body')
const router = require('./routes')
const db = require('./models')
const serveStatic = require('./static')
const config = require('./config')
const {Jt808App} = require('./jt808')

const logger = require('log4js').getLogger()

const app = new Koa()
const jtt = new Jt808App(config.jtt808)
  
// app.proxy = true
app.context.db = db
jtt.context.db = db

jtt.on('error', (err) => {
  logger.error(err)
})

app.on('error', err => {
  console.error('server error', err)
})

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    ctx.status = e.status || 500
    ctx.body = e.message
    if (ctx.status === 500) {
      logger.error(ctx.path, e.message)
    } else {
      if (ctx.status !== 401) {
        logger.warn(ctx.path, e.message)
      }
    }
  }
})

app.use(koaBody())

app
  .use(router.routes())
  .use(router.allowedMethods())

app.use(serveStatic('/', path.join(__dirname, '../public'), {gzip: true}))

const server = http.createServer(app.callback())
if (config.websocket) {
  require('./services/websocket')(app, server)
}

let httpsServer
if (config.sslOption) {
  httpsServer = https.createServer(config.sslOption, app.callback())
  if (config.websocket) {
    require('./services/websocket')(app, httpsServer)
  }
}

const numCPUs = require('os').cpus().length
if (config.cluster && numCPUs > 1) {

  if (cluster.isMaster) {
    logger.info(`http server on HTTP:${config.port} JT808:${config.jtt808.port}, on ${numCPUs} cores`)
    console.log(`http server on HTTP:${config.port} JT808:${config.jtt808.port}, on ${numCPUs} cores`)
    if (httpsServer) {
      console.log('https enabled')
    }
  
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }
  
    cluster.on('listening', (worker, address) => {
      logger.debug(`start core: ${worker.id}`)
    })
  
    cluster.on('exit', (worker, code, signal) => {
      console.log(signal)
      logger.warn(`reboot core: ${worker.id}`)
      setTimeout(() => cluster.fork(), 2000)
    })
  } else {
    server.listen(config.port)
    if (httpsServer) {
      httpsServer.listen(443)
    }
    jtt.listen(config.jtt808.port)
  }  
} else {
  logger.info(`Server on HTTP:${config.port} JT808:${config.jtt808.port}, on single core mode`)
  console.log(`http server on HTTP:${config.port} JT808:${config.jtt808.port}, on single core mode`)
  if (httpsServer) {
    console.log('https enabled')
  }
  server.listen(config.port)
  if (httpsServer) {
    httpsServer.listen(443)
  }
  jtt.listen(config.jtt808.port)
}

module.exports = app
