'use strict'

const {EventEmitter} = require('events')
const _ = require('lodash')
const Peer = require('./peer')
const {ComplexParser} = require('bindings')('complex_parser')
const createServer = require('./server')
const logger = require('log4js').getLogger()

class Jt808App extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = config
    this.context = {}
    this._peers = {}
  }

  handler() {
    return (msg, socket) => {
      this.handle(msg, socket)
    }
  }

  emitPeerEvent(evt, peer, ...args) {
    const ctx = {...this.context, peer}
    this.emit(evt, ctx, ...args)
  }

  async handle(msg, socket) {
    let peer = socket._peer
    if (msg == null) {
      // close
      if (peer) {
        peer.off()
        logger.info(`[${peer.imei}] disconnected`)
        socket._peer = null
      }
      return
    }

    logger.debug('incoming message %j', {
      messageId: msg.messageId,
      encrypted: msg._encrypted,
      SN: msg.SN,
      packagesCount: msg._packagesCount,
      packageIndex: msg._packageIndex,
      imei: msg.imei,
      data: msg.data && msg.data.length
    })

    // binding socket to peer
    if (!peer) {
      peer = this._peers[msg.imei]
      if (peer) {
        if (peer.socket) {
          if (peer.authed) {
            logger.error(`[${peer.imei}] duplicate connect from ${socket.remoteAddress}`);
            return
          }
          peer.off()
        }

        peer.socket = socket
        if (socket.remoteAddress !== peer.addr) {
          peer.addr = socket.remoteAddress
          peer.authed = false
        }
      } else {
        peer = new Peer(msg.imei, socket)
        this._peers[msg.imei] = peer
      }

      socket._peer = peer
      socket.parser[ComplexParser.kOn808MessagePrev] = peer.getPreviousMessage.bind(peer)
    }

    try {
      await peer.handleMessage(this, msg)
    } catch (err) {
      logger.error('handleMessage error', err)
    }
  }

  listen(options, callback) {
    const svr = createServer(this)

    svr.on('error', err => {
      this.emit('error', err)
    })

    svr.listen(options, callback)
  }
}

const commandsList = [   
  ['setParams', 0x8103],
  'queryParams',
  ['controlTerminal', 0x8105],
  ['queryProperties', 0x8107],
  ['upgradePackage', 0x8108],
  ['queryPosition', 0x8201],
  ['trackPosition', 0x8202],
  ['confirmAlarms', 0x8203],
  ['setText', 0x8300],
  ['setEvents', 0x8301],
  ['question', 0x8302],
  ['setInfos', 0x8303],
  ['infoContent', 0x8304],
  ['callback', 0x8400],
  ['setPhonebook', 0x8401],
  ['controlVehicle', 0x8500],
  ['queryMedia', 0x8802],
  'uploadMedia',
  'requestDrvierIdentity',
  'shot',
  'recordAudio',
  'sendData',
  'initialMessage', 
  'requireRSA',
  'request',
  ['custom', 0x8e00] 
]

// wrap for peer operations
// return promise list
commandsList.forEach(cmd => {

  let messageId = null
  if (_.isArray(cmd)) {
    [cmd, messageId] = cmd
  }

  Jt808App.prototype[cmd] = function (imeis, prop, opt, ...args) {
    const isarray = _.isArray(imeis)
    if (!isarray) {
      imeis = [imeis]
    }

    const peerCall = (imei) => {
      const peer = this._peers[imei]
      if (!peer || !peer.socket || !peer.authed) {
        return Promise.resolve(new Error('no connection'))
      }

      if (messageId != null) {
        return peer.promiseWrite(messageId, prop, opt)
      } else {
        return peer[cmd](prop, opt, ...args)
      }
    }

    if (_.isArray(imeis)) {
      return imeis.map(imei => peerCall(imei))
    } else {
      return peerCall(imeis)
    }
  }
})

module.exports = Jt808App
