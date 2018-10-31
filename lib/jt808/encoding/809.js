'use strict';

const binding = require('bindings')('complex_parser');
const Parser = binding.ComplexParser;
const iconv = require('iconv-lite');
const _ = require('lodash');

const {BufferArgs, createBuffer} = require('./buffer');


function pushTime(args, time) {
    if (time instanceof Date)
        time = Math.floor(time.getTime()/1000);
                    
    args.dword(Math.floor(time/0x100000000));
    args.dword(time&0xffffffff);
}

function putDwordGbk(args, content) {
    let buf = iconv.encode(content||'','gbk');
    args.dword(buf.length);
    args.buf(buf);
}

function pushGnss(args, prop) {
    let time = prop.time;
    if (!(time instanceof Date)) {
        time = new Date(prop.time || 0);
    }
    args.byte(prop.encrypt);
    args.byte(time.getDate());
    args.byte(time.getMonth());
    args.word(time.getFullYear());
    args.byte(time.getHours());
    args.byte(time.getMinutes());
    args.byte(time.getSeconds());
    args.dword(Math.floor(prop.lng*1000000));
    args.dword(Math.floor(prop.lat*1000000));
    args.word(prop.speed);
    args.word(prop.boardSpeed);
    args.dword(prop.mileage);
    args.word(prop.direction);
    args.word(prop.altitude);
    args.dword(prop.status);
    args.dword(prop.alarms);
}
                

module.exports = function(opt, prop) {

    opt = opt || {};
    const sn = opt.sn;
    const messageId = opt.messageId;
    const centerId = opt.centerId;
    const version = opt.version || '';
    let content = opt.content;

    let encrypt;
    if (opt.encryptKey) {
        encrypt = {
            key: encryptKey,
            M1: opt.M1,
            IA1: opt.IA1,
            IC1: opt.IC1
        };
    }

    if (content === undefined) {

        const mask = messageId & 0x0f00;

        if (mask === 0x0200 || mask === 0x0400 || mask === 0x0500 || mask === 0x0600) {
            prop = prop || {};

            const args = new BufferArgs();
            switch(messageId) {
                    case 0x1201:
                        args.str(prop.platformId, 11);
                        args.str(prop.producerId, 11);
                        args.str(prop.model, 20);
                        args.str(prop.terminalId, 7);
                        args.str(prop.simno, 12);
                        break;
                    case 0x1202:
                    case 0x9202: {
                        pushGnss(args, prop);
                        break;
                    }
                    case 0x1203:
                    case 0x9203: {
                        const items = prop.items || [];
                        args.byte(items.length);
                        items.forEach(item=> pushGnss(args, item));
                        break;
                    }
                    case 0x1207:
                    case 0x1209: {
                        let start = prop.start;
                        let end = prop.end;
                        if (start instanceof Date)
                            start = Math.floor(start.getTime()/1000);
                        if (end instanceof Date)
                            end = Math.floor(end.getTime()/1000);

                        args.dword(Math.floor(start/0x100000000));
                        args.dword(start&0xffffffff);
                        args.dword(Math.floor(end/0x100000000));
                        args.dword(end&0xffffffff);
                        break;
                    }
                    case 0x120a:
                    case 0x120c: {
                        args.gbk(prop.driverName, 16);
                        args.str(prop.driverId, 20);
                        args.gbk(prop.license, 40);
                        args.gbk(prop.orgName, 200);
                        break;
                    }
                    case 0x120b:
                    case 0x120d: {
                        const bill = prop.data || [];
                        args.dword(bill.length);
                        args.buf(bill);
                        break;
                    }

                case 0x9204:
                case 0x1601: {
                    let data = prop.data;
                    if (typeof data !== 'string') {
                        let pairs = [];
                        for (let k in prop) {
                            if (!_.includes(['plateNo', 'color', 'type'], k)) {
                                pairs.push(`${k}:=${prop[k]}`);
                            }
                        }
                        data = pairs.join(';');
                    }
                    args.gbk(data);
                    break;
                }

                case 0x9205: 
                case 0x9206: 
                case 0x9207: 
                case 0x9208: 
                case 0x9209: 
                case 0x1501: 
                case 0x1505:
                    args.byte(prop.result);
                    break;

                case 0x1401: {
                    args.dword(prop.supervisionId);
                    args.byte(prop.result);
                    break;
                }

                case 0x1402: {
                    let info = iconv.encode(prop.content||'','gbk');
                    args.byte(prop.warnSrc);
                    args.word(prop.warnType);
                    pushTime(args, prop.warnTime);
                    args.dword(prop.infoId);
                    args.dword(info.length);
                    args.buf(info);
                    break;
                }

                case 0x1403: {
                    args.dword(prop.infoId);
                    args.byte(prop.result);
                    break;
                }

                case 0x9401:
                    args.byte(prop.warnSrc);
                    args.word(prop.warnType);
                    pushTime(args, prop.warnTime);
                    args.dword(prop.supervisionId);
                    pushTime(args, prop.endTime);
                    args.byte(prop.level);
                    args.gbk(prop.supervisor, 16);
                    args.str(prop.phoneNumber, 20);
                    args.str(prop.email, 32);
                    break;

                case 0x9402:
                case 0x9403: {
                    let info = iconv.encode(prop.content||'','gbk');
                    args.byte(prop.warnSrc);
                    args.word(prop.warnType);
                    pushTime(args, prop.warnTime);
                    args.dword(info.length);
                    args.buf(info);
                    break;
                }

                case 0x1502: {
                    args.byte(prop.flag);
                    pushGnss(args, prop);
                    args.byte(prop.lensId);
                    args.dword(prop.data && prop.data.length);
                    args.byte(prop.sizeType);
                    args.byte(prop.format);
                    args.buf(prop.data);
                    break;
                }

                case 0x1503: {
                    args.dword(prop.ackId);
                    args.byte(prop.result);
                    break;
                }

                case 0x1504: {
                    args.byte(prop.cmd);
                    putDwordGbk(args, prop.travelData);
                    break;
                }

                case 0x9501: {
                    args.str(prop.phoneNumber, 20);
                    break;
                }

                case 0x9502: {
                    args.byte(prop.lensId);
                    args.byte(prop.sizeType);
                    break;
                }

                case 0x9503: {
                    args.dword(prop.sequence);
                    args.byte(prop.priority);
                    putDwordGbk(args, prop.content);
                    break;
                }

                case 0x9504: 
                    args.byte(prop.cmd);
                    break;

                case 0x9505: {
                    args.str(prop.authCode, 10);
                    args.gbk(prop.accessPoint, 20);
                    args.str(prop.username, 49);
                    args.str(prop.password, 22);
                    args.str(prop.serverIp, 32);
                    args.word(prop.tcpPort);
                    args.word(prop.udpPort);
                    pushTime(args, prop.endTime);
                    break;
                }
            }
                
            const data = args.createBuffer();

            const newargs = new BufferArgs();
            newargs.gbk(prop.plateNo, 21);
            newargs.byte(prop.color);
            newargs.word(prop.type);
            newargs.dword(data.length);
            newargs.buf(data);

            content = newargs.createBuffer();
            
        } else if (mask === 0x0300) {

            prop = prop || {};
            let data = prop.data || [];

            const args = new BufferArgs();
            args.word(prop.type);
            args.dword(data.length);

            switch(messageId) {
                case 0x1301:
                case 0x9301:
                case 0x9302: {
                    let info = iconv.encode(prop.content||'','gbk');
                    args.byte(prop.objectType);
                    args.str(prop.objectId, 12);
                    args.dword(prop.infoId);
                    args.dword(info.length);
                    args.buf(info);
                    break;
                }

                case 0x1302:
                    args.dword(prop.infoId);
                    break;
            }

            args.buf(data);
            content = args.createBuffer();

        } else {
            switch (messageId) {
                case 0x1001: {
                    prop = prop || {};
                    content = createBuffer('dword,str/8,str/32,word', prop.userId, prop.password, prop.ip, prop.port);
                    break;
                }

                case 0x1002: {
                    prop = prop || {};
                    content = createBuffer('byte,dword', prop.result, prop.code);
                    break;
                }

                case 0x1003: {
                    prop = prop || {};
                    content = createBuffer('dword,str/8', prop.userId, prop.password);
                    break;
                }

                case 0x1007:
                case 0x1008:
                case 0x9002: 
                case 0x9007:
                case 0x9008:
                    content = createBuffer('byte', prop);
                    break;

                case 0x9001: 
                case 0x9003:
                    content = createBuffer('dword', prop);
                    break;

                case 0x9101: {
                    prop = prop || {};
                    let start = prop.start;
                    let end = prop.end;
                    if (start instanceof Date)
                        start = Math.floor(start.getTime()/1000);
                    if (end instanceof Date)
                        end = Math.floor(end.getTime()/1000);

                    content = createBuffer('dword,dword,dword,dword,dword', prop.total, 
                            Math.floor(start/0x100000000), start&0xffffffff, 
                            Math.floor(end/0x100000000), end&0xffffffff);
                    break;
                }
            
                default:
                    break;
            }
        }
    }

    const verArray = version.split('.').map(n=>+n);
    let [buf,crc,left] = Parser.packing809(
        sn,
        messageId,
        centerId,
        Buffer.from(verArray),
        content || Buffer.from([]),
        encrypt
    );

    return buf;
}
