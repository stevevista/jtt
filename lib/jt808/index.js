'use strict';

const {EventEmitter}    = require('events');
const _                 = require('lodash');
const mixin             = require('merge-descriptors');
const Peer              = require('./808');
const {ComplexParser}   = require('bindings')('complex_parser');
const config            = require('../config');
const logger            = require('log4js').getLogger('main');



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
    _peers: {}
};

/*
[   
        'requestPosition',
            'requestDrvierIdentity',
            'queryMedia',
            'uploadMedia',

            'setEvents',
            'queryParams',
            'setParams',
            'shot',
            
            'recordAudio',
            'sendData',
            
            'initialMessage', 
            'requireRSA',
            'request'].forEach(cmd=> {
            this[cmd] = (imeis, prop, opt, ...args)=> {
                
                if (!_.isArray(imeis)) {
                    imeis = [imeis];
                }

                let propVal = prop;

                if (prop && prop.timeout) {
                    propVal = {};
                }

                const propData = JSON.stringify(propVal);

                const results = [];

                imeis.forEach(imei=> {
                    let r;
                    const peer = this._peers[imei];
                    if (!peer || !peer.socket || !peer.vehicle_id) {
                        r = Promise.resolve(new Error('no connection'));
                    } else {
                        let action = peer[cmd](prop, opt, ...args);

                        if (this.options.recordRequest) {

                            // record requests in db
                            r = db.request.create({
                                command: cmd,
                                data: propData,
                                vehicle_id: peer.vehicle_id,
                                plate_no: peer.plate_no,
                                sim_no: imei,
                                status: 0
                            }).then(d => {
                                action.then((ack)=> {
                                    if (ack instanceof Error)
                                        d.update({status:3, error: ack.message});
                                    else
                                        d.update({status:2, returned: JSON.stringify(ack)});
                                });
                                return d.id;
                            });
                        } else {
                            r = action;
                        }

                        
                    }
                    results.push(r);
                });

                return Promise.all(results);
            }
        });
*/
app.init = function() {
    [   
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

        ['custom', 0x8e00] ].forEach(cmd=> {

            let messageId = null;

            if (_.isArray(cmd)) {
                messageId = cmd[1];
                cmd = cmd[0];
            }

            this[cmd] = (imeis, prop, opt, ...args)=> {
                
                const isarray = _.isArray(imeis);
                if (!isarray) {
                    imeis = [imeis];
                }

                const results = [];

                imeis.forEach(imei=> {
                    let r;
                    const peer = this._peers[imei];
                    const info = (peer && peer._prop) || {imei};
                    if (!peer || !peer.socket || !peer.authed) {
                        r = Promise.resolve(new Error('no connection'));
                    } else {
                        if (messageId != null) {
                            r = peer.promiseWrite(messageId, prop, opt);
                        } else {
                            r = peer[cmd](prop, opt, ...args);
                        }
                    }
                    results.push([info, r]);
                });

                return isarray ? results : results[0];
            }
    });

    logger.info('JTT808 Server created');
} 


app.handle = function handle(msg, socket) {

    let peer = socket._peer;

    if (msg == null) {
        // close
        if (peer) {
            peer.off();
            this.emit('offline', peer._prop);
            logger.info(`[${peer.imei}] disconnected`);
            socket._peer = null;
        }
        return;
    }

    logger.debug('incoming message %j', {
        messageId: msg.messageId,
        encrypted: msg._encrypted,
        SN: msg.SN,
        packagesCount: msg._packagesCount,
        packageIndex: msg._packageIndex,
        imei: msg.imei,
        data: msg.data && msg.data.length
    });

    // binding socket to peer
    if (!peer) {
        peer = this._peers[msg.imei];
        if (peer) {
            if (peer.socket) {
                if (peer.authed) {
                    logger.error(`[${peer.imei}] duplicate connect from ${socket.remoteAddress}`);
                    return;
                }
                peer.off();
            }

            peer.socket = socket;
            if (socket.remoteAddress !== peer.addr) {
                peer.addr = socket.remoteAddress;
                peer.authed = false;
                peer._prop.addr = socket.remoteAddress;
            }
        } else {
            peer = new Peer(msg.imei, socket);
            this._peers[msg.imei] = peer;
        }

        socket._peer = peer;
        socket.parser[ComplexParser.kOn808MessagePrev] = peer.getPreviousMessage.bind(peer);
    }

    
    peer.handleMessage(this, msg);
}

