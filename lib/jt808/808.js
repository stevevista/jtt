'use strict';

const _                 = require('lodash');
const { EventEmitter }  = require('events');
const encode            = require('./encoding/808');
const config            = require('../config');
const logger            = require('log4js').getLogger('main');


const MESSAGES = {
    0x0108: {
        name: 'upgradeAck',
        ackTo: 0x8108
    },
    0x0302: {
        name: 'answer',
        ackTo: 0x8302
    },
    0x0303: {
        name: 'infoDemand',
        autoAck: true
    },
    0x0500: {
        name: 'controlAck',
        ackTo: 0x8500
    },
    0x0701: {
        name: 'bill',
        autoAck: true
    },
    0x0704: {
        name: 'posData',
        autoAck: true
    },
    0x0705: {
        name: 'canData',
        autoAck: true
    },
    0x0800: {
        name: 'mediaEvent',
        autoAck: true
    },
    0x0805: {
        name: 'shotAck',
        ackTo: 0x8801
    },
    0x0900: {
        name: 'data',
        autoAck: true
    },
    0x0901: {
        name: 'zip',
        autoAck: true
    }
};


const AUTO_ACK_MSGS = Object.keys(MESSAGES).filter(t=> MESSAGES[t].autoAck).map(t=>+t);

module.exports = 
class Peer {
    constructor(imei, socket) {
        this.socket = socket;
        this.addr = socket.remoteAddress;
        this.imei = imei;

        this._prop = {
            imei,
            addr: this.addr
        };

        this._prevMessages = {};
        this._prevMessagesCtx = {};
        this._pendings = {};
        this._uploadFile = null;
        this._sn = 0;
    }

    pushPackageArray(msg, ary) {

        if (msg._packageIndex > 1) {
            ary = this._prevMessagesCtx[msg.messageId].concat(ary);
        }
        this._prevMessagesCtx[msg.messageId] = ary;
        return ary;
    }

    getPreviousMessage(msg) {
        const lastMsg = this._prevMessages[msg.messageId];
        if (lastMsg && lastMsg._packageIndex+1 === msg._packageIndex)
            return lastMsg;
        else {
            const prevIndex = lastMsg ? lastMsg._packageIndex : 0;
            const ids = _.range(prevIndex+1, msg._packageIndex);
            if (!lastMsg || msg.messageId !== 0x0801) {
                this.write(0x8003, {ackSN: msg.SN, ids});
            } else {
                this.write(0x8800, {mediaId: lastMsg.mediaId, ids});
            }
        }
    }

    intergreted(msg) {
        if (isSinglePackage(msg))
            return;

        if (msg._packageIndex === msg._packagesCount) 
            this._prevMessages[msg.messageId] = null;
        else
            this._prevMessages[msg.messageId] = msg;
    }

    
    canResolve(messageId, sn) {
        let tasks = this._pendings[messageId];
        if (tasks) {
            for (let i=tasks.length-1; i>=0; i--) {
                let [SN, func] = tasks[i];
                if (sn == null || SN === sn) {
                    return true;
                }
            }
        }
    }

    resolve(messageId, sn, data) {
        let tasks = this._pendings[messageId];
        if (tasks) {
            for (let i=tasks.length-1; i>=0; i--) {
                let [SN, func] = tasks[i];
                if (sn == null || SN === sn) {
                    tasks.splice(i, 1);
                    func(data);
                    return true;
                }
            }
        }
    }

    promiseWrite(messageId, prop, opt) {

        const timeout = opt && opt.timeout || 1000*10;
        const retry = opt && opt.maxRetry || 0;

        const [sn, data] = this.write(messageId, prop, opt);

        return new Promise((resolve)=> {

            let timeoutCount = 0;

            const timeoutF = ()=> {
                if (timeoutCount++ < retry) {
                    this.socket.write(data);
                    timer = setTimeout(timeoutF, timeout*timeoutCount);
                    logger.warn(`[${this.imei}]: retry send <${messageId}>, left ${retry-timeoutCount}`);
                } else {
                    this.resolve(messageId, sn, new Error('timeout'));
                }
            };

            let timer = setTimeout(timeoutF, timeout);

            const callback = (ack)=> {
                clearTimeout(timer);
                resolve(ack);
            };

            (this._pendings[messageId] || (this._pendings[messageId] = [])).push([sn, callback]);
        });
    }

    clearPromises() {
        for (let k in this._pendings) {
            this._pendings[k].forEach(([,func])=> {
                func(new Error('peer closed'));
            });
            this._pendings[k] = [];
        }
    }

    off() {
        this.clearPromises();

        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = null;
        }

        this.socket = null;
    }

    heartBeat(app) {
        // heart beat
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }
        const interval = config.jtt808.heartBeatInterval;
        this.syncTimer = setTimeout(()=> {
            app.emit('lostHeartBeat', this._prop, interval, (close)=> {
                if (close) this.socket.end();
            });
        }, interval);
    }

    ack(msg, result=0) {
        return this.write(0x8001, {ackSN: msg.SN, messageId: msg.messageId, result});
    }

    requireRSA(rsa, opt) {
        opt = opt || {};
        this.socket.parser.setDecRSA(rsa.e, rsa.n, rsa.d);
        return this.promiseWrite(0x8a00, rsa, opt);
    }

    setRSA(rsa) {
        this.write(0x8a00, rsa, {});
        this.socket.parser.setDecRSA(rsa.e, rsa.n, rsa.d);
    }

    
    sendData(prop, opt) {
        return this.promiseWrite(0x8900, prop, opt);
    }

    recordAudio({stop=false, duration=30, upload=true, frequency=0}, opt) {
        return this.promiseWrite(0x8804, {stop, duration, upload, frequency}, opt);
    }

    queryParams(prop, opt) {
        return this.promiseWrite(prop && prop.length ? 0x8106 : 0x8104, prop, opt);
    }

    /**
     * write message to server
     * it's a wrapper around encode
     */
    write(messageId, prop, opt) {
        opt = opt || {};
        opt.sn = ++this._sn;
        opt.messageId = messageId;
        opt.imei = this.imei;

        if (opt.encrypt && this.rsa) {
            opt.e = this.rsa.e;
            opt.n = this.rsa.n;
        }

        const data = encode(opt, prop);
        this.socket.write(data);
        return [opt.sn, data];
    }

    // 0x8702 request driver identity
    requestDrvierIdentity(opt) {
        return this.promiseWrite(0x8702, {}, opt);
    }

    // camera shot
    shot(propIn, opt) {
        let prop = _.assignIn({
            pictures: 1,
            resolution: 1, 
            quality: 1,
            brightness: 100,
            contrast: 100,
            saturation: 100,
            chroma: 100
        }, propIn);
        return this.promiseWrite(0x8801, prop, opt);
    }

    // 8805 /8803
    uploadMedia(prop, opt) {
        return this.promiseWrite(prop && prop.mediaId ? 0x8805 : 0x8803, prop, opt);
    }

    // custom request
    request(prop, opt) {
        prop = prop || {};
        opt = opt || {};
        if (opt.content == null)
            opt.content = prop.content;
        return this.promiseWrite(prop.messageId, prop, opt);
    }

    emitMediaFile(app, msg) {
        if (isFirstPackage(msg)) {
            let f = new EventEmitter();
            copyMesageHeader(f, msg);
            this._uploadFile = f;
            app.emit('mediaFile', this._prop, f);
        }

        if (isFinalPackage(msg)) {
            this._uploadFile.emit('end', msg.data);
            this.write(0x8800, {mediaId: this._uploadFile.mediaId});
            this._uploadFile = null;
        } else {
            this._uploadFile.emit('data', msg.data);
        }
    }

    handleMessage(app, msg) {

        // heart beat
        this.heartBeat(app);

        switch(msg.messageId) {

            // generic ack
            case 0x0001: {
                this.resolve(msg.ackId, msg.ackSN, intResult(msg.result, ['', 'fail', 'message wrong', 'not support']));
                return;
            }

            // auth
            case 0x0102: {
                app.emit('auth', this._prop, msg.token, (result)=> {
                    this.authed = (result === 0);
                    this.ack(msg, result);
                });
                return;
            }

            case 0x0100: {
                app.emit('register', this._prop, msg, (result, token)=> {
                    this.authed = (result === 0);
                    this.write(0x8100, {ackSN: msg.SN, result, token});
                });
                return;
            }

            case 0x0003: {
                this.ack(msg);
                this.authed = false;
                app.emit('unregister', this._prop);
                return;
            }

            // rsa response or request
            case 0x0a00: {
                this.rsa = {e:msg.e, n: msg.n};
                const unsolicited = !this.resolve(0x8a00, msg.ackSN, 0);
                let next = null;
                if (unsolicited) {
                    next = (rsa)=> {
                        if (!rsa) {
                            this.ack(msg, 3);
                        } else {
                            this.setRSA(rsa);
                        }
                    };
                }
                app.emit('rsa', this._prop, this.rsa, next);
                return;
            }
        }

        // now we need auth
        if (!this.authed) {
            logger.error(`[${this.imei}] not authed for msg:${msg.messageId}`);
            return;
        }

        this.intergreted(msg);

        switch(msg.messageId) {
            case 0x0104: {
                if (!this.resolve(0x8106, msg.ackSN, 0)) {
                    this.resolve(0x8104, msg.ackSN, 0);
                }
                app.emit('params', this._prop, msg.params);
                return;
            }

            case 0x0107: {
                this.resolve(0x8107, msg.ackSN, 0);
                app.emit('properties', this._prop, msg);
                return;
            }

            case 0x0200: {
                app.emit('position', this._prop, msg);
                return;
            }
            case 0x0201: {
                app.emit('position', this._prop, msg, (ret)=> {
                    this.resolve(0x8201, msg.ackSN, ret);
                });
                return;
            }
            case 0x0500: {
                app.emit('position', this._prop, msg, (ret)=> {
                    this.resolve(0x8500, msg.ackSN, ret);
                });
                return;
            }

            case 0x0301: {
                this.ack(msg);
                app.emit('event', this._prop, msg.event);
                return;
            }

            case 0x0700: {
                app.emit('drivingRecord', this._prop, msg, (ret)=> {
                    this.resolve(0x8700, msg.ackSN, ret);
                });
                return;
            }

            // drive report
            case 0x0702: {
                const unsolicited = !this.canResolve(0x8702, msg.ackSN);
                let next = null;
                if (unsolicited) {
                    this.ack(msg);
                } else {
                    next = (ret)=> {
                        isack = this.resolve(0x8702, msg.ackSN, ret);
                    };
                }
                app.emit('driver', this._prop, msg, next);
                return;
            }

            // multimedia uploading
            case 0x0801: {
                this.emitMediaFile(app, msg);
                return;
            }

            case 0x0802: {
                let ids = msg.items.map(item=> item.mediaId);

                if (!isSinglePackage(msg)) {
                    ids = this.pushPackageArray(msg, ids);
                }

                if (isFinalPackage(msg)) {
                    this.resolve(0x8802, msg.ackSN, ids);
                }
                app.emit('medias', this._prop, msg.items);
                return;
            }

            case 0x0805: {
                let ids = msg.result === 0 ? msg.ids : null;
                if (ids && !isSinglePackage(msg)) {
                    ids = this.pushPackageArray(msg, ids);
                }

                if (isFinalPackage(msg)) {
                    this.resolve(0x8801, msg.ackSN, ids || intResult(msg.result, ['', 'fail', 'message wrong', 'channel not support']));
                }
                return;
            }
        }

        const messageInfo = MESSAGES[msg.messageId] || { name: 'custom' };
        const messageName = messageInfo.name;

        if (messageInfo.ackTo) {
            const ret = {};
            copyMesageBody(ret, msg);
            delete ret.ackSN;
            this.resolve(messageInfo.ackTo, msg.ackSN, ret);
            return;
        }

        // can-data
        if (_.includes(AUTO_ACK_MSGS, msg.messageId)) {
            this.ack(msg);
            const ret = {};
            copyMesageBody(ret, msg);
            app.emit(messageName, this._prop, ret);
            return true;
        }

        app.emit(messageName, msg, this._prop, (result)=> {
            this.ack(msg, result);
        });
    }
}


function isSinglePackage(msg) {
    return (!msg._packagesCount || 1 === msg._packagesCount);
}

function isFirstPackage(msg) {
    return (!msg._packagesCount || msg._packageIndex === 1);
}

function isFinalPackage(msg) {
    return (!msg._packagesCount || msg._packageIndex === msg._packagesCount);
}

function copyMesageHeader(obj, msg) {
    for (let k in msg) {
        if (['data', 'items', '_padding', '_packageIndex'].indexOf(k) < 0) {
            obj[k] = msg[k];
        }
    }
}

function copyMesageBody(obj, msg) {
    for (let k in msg) {
        if (k.indexOf('_') !== 0 && ['messageId', 'SN', 'imei'].indexOf(k) < 0) {
            obj[k] = msg[k];
        }
    }
}

function intResult(v, options) {
    if (v === 0) 
        return 0;
    else {
        const desc = options[v] || `error:${v}`;
        const err = new Error(desc);
        err._code = v;
        return err;
    }
}


