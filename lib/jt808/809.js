'use strict';

const _                 = require('lodash');
const net               = require('net');
const {EventEmitter}    = require('events');
const mixin             = require('merge-descriptors');
const {ComplexParser}   = require('bindings')('complex_parser');
const encode            = require('./encoding/809');
const config            = require('../config');

const logger = require('log4js').getLogger('main');


exports = module.exports = createApplication;

function createApplication() {
    const serv = function(msg, socket) {
        serv.handle(msg, socket);
    };

    mixin(serv, EventEmitter.prototype, false);
    mixin(serv, app, false);

    serv.init();
    return serv;
}

const app = {
    socket: null,
    mainSocket: null,
    _sn: 0
};

app.init = function() {
    this.conectMain();
    logger.info('JTT809 Secondary linkage listener initialized');
};


app.handle = function handle(msg, socket) {

    if (msg == null) {
        // close
        this.socket = null;
        return;
    }

    if (this.socket == null) {
        if (msg.messageId === 0x9001) {
            if (msg.code === this.monitorAccessCode) {

                this.write(0x9002, {result: 0});
                this.socket = socket;

                socket.parser.set809EncryptKeys(
                        config.jtt809.monitorEncrypt.M1, 
                        config.jtt809.monitorEncrypt.IA1, 
                        config.jtt809.monitorEncrypt.IC1);
            } else {

                this.write(0x9002, {result: 1});
            }
            return;
        }
    }

    if (this.socket !== socket) {
        // reject
        logger.error(`duplicate 809 connect from ${socket.remoteAddress}`);
        socket.close();
        return;
    }

    this.handleMessage(msg, socket);
};


app.conectMain = function() {

    this.doConnect();
};

app.doConnect = function() {

    if (this.cancelled)
        return;

    let socket = new net.Socket();
    socket.connect(config.jtt809.monitorPort, config.jtt809.monitorIp, ()=> {
        const parser = new ComplexParser();
        parser.set809EncryptKeys(
                config.jtt809.monitorEncrypt.M1, 
                config.jtt809.monitorEncrypt.IA1, 
                config.jtt809.monitorEncrypt.IC1);

        parser[ComplexParser.kOn809Message] = (msg)=> {

            if (!this.mainSocket) {
                if (msg.messageId === 0x1002) {
                    if (msg.result === 0) {
                        this.onMainLinkEstablished(socket, msg.code);
                    } else if (msg.result === 5) {
                        setTimeout(()=> this.connectReq(socket), 10000);
                    } else {
                        socket.close();
                    }
                }
            } else {
                this.handleMessage(msg, socket);
            }
        };

        socket.on('data', (d)=> {
            parser.execute(d);
        });

        this.connectReq(socket);
    });
    socket.on('error', (err) => {
        logger.error(err);
        setTimeout(()=> this.doConnect(), 60000); 
    });
}



/**
* write message to server
* it's a wrapper around encode
*
* opt.encrypt -- 
* opt.socket -- 
*/
app.write = function(messageId, prop, opt) {

    opt = opt || {};
    opt.sn = ++this._sn;
    opt.messageId = messageId;
    opt.centerId = config.jtt809.centerId;
    opt.version = config.jtt809.version;

    if (opt.encrypt) {
        opt.encryptKey = config.jtt809.encrypt.key;
        opt.M1 = config.jtt809.encrypt.M1;
        opt.IA1 = config.jtt809.encrypt.IA1;
        opt.IC1 = config.jtt809.encrypt.IC1;
    }

    const socket = opt.socket || this.mainSocket;
    const data = encode(opt, prop);

    socket.write(data);
    return [opt.sn, data];
}

app.connectReq = function(socket) {
    return this.write(0x1001, {
            userId: config.jtt809.userId,
            password: config.jtt809.password,
            ip: config.jtt809.serverIp,
            port: config.port    
        }, {
            socket
        });
}

app.onMainLinkEstablished = function(socket, code) {
    this.mainSocket = socket;
    this.monitorAccessCode = code;
    logger.info('809 server connected');
}

app.handleMessage = function(msg) {

}
