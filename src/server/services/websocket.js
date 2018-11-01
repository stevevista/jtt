'use strict'
const WebSocket = require('ws')
const url = require('url')
const Router = require('koa-router')
const {authenticateRequird} = require('../auth')

const router = new Router()

router.all('/mqtt/:topicName/:acc?', authenticateRequird(), async ctx => {
})

function bind(app, server) {
  const ws = new WebSocket.Server({ server })
  ws.on('connection', async (socket, req) => {
    const ctx = app.createContext(req)
    ctx.websocket = socket
    ctx.path = url.parse(req.url).pathname

    try {
      await router.routes()(ctx, () => {
        console.log('Not Found Websocket path')
        socket.close()
      })
    } catch (e) {
      console.log('ws error', e)
      socket.close()
    }
  })
}

module.exports = bind
