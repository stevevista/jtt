'use strict';

const binding = require('bindings')('complex_parser');
const Parser = binding.ComplexParser;
const iconv = require('iconv-lite');
const _ = require('lodash');

const {BufferArgs, createBuffer} = require('./buffer');


function pack({
    messageId,
    sn,
    imei='',
    content,
    packagesCount,
    packageIndex,
    e,
    n
}) {
    if (!content || content.length === 0) {
        content = Buffer.from([]);
    } else if (!(content instanceof Buffer)) {
        content = Buffer.from(content);
    }

    return Parser.packing(
        messageId,
        sn,
        imei,
        packagesCount,
        packageIndex,
        content,
        e,
        n
    );
}   



const PARAMS_SIZE4 = [
    [0x0001, 0x0007],
    [0x0018, 0x0019],
    [0x001b, 0x001c],
    [0x0020, 0x0030],
    [0x0045, 0x0047],
    [0x0050, 0x005a],
    [0x0064, 0x0065],
    [0x0070, 0x0074],
    [0x0080, 0x0080],
    [0x0093, 0x0093],
    [0x0095, 0x0095],
    [0x0100, 0x0100],
    [0x0102, 0x0102]
];

const PARAMS_SIZE2 = [
    [0x0031, 0x0031],
    [0x005b, 0x005e],
    [0x0081, 0x0082],
    [0x0101, 0x0101],
    [0x0103, 0x0103]
];

const PARAMS_SIZE1 = [
    [0x0084, 0x0084],
    [0x0090, 0x0092],
    [0x0094, 0x0094]
];

const PARAMS_STR = [
    [0x0010, 0x0017],
    [0x001a, 0x001a],
    [0x001d, 0x001d],
    [0x0040, 0x0044],
    [0x0048, 0x0049],
    [0x0083, 0x0083]
];


function inRange(id, collect) {
    for (let [a1,a2] of collect) {
        if (a1 > id)
            break;
        if (a1 <= id && a2 >= id)
            return true;
    }
    return false;
}

function paramSize(id) {
    if (inRange(id, PARAMS_SIZE4))
        return 4;
    if (inRange(id, PARAMS_SIZE2))
        return 2;
    if (inRange(id, PARAMS_SIZE1))
        return 1;
    if (inRange(id, PARAMS_STR))
        return 0;
}


function fillParams(args, params) {
    params = params || [];

    args.byte(params.length);

    params.forEach(([k,v])=> {
        args.dword(k);

        let size = paramSize(k);
        args.byte(size || v.length);
        if (size === 0) {
            args.str(v);
        } else if (size === 1) {
            args.byte(v);
        } else if (size === 2) {
            args.word(v);
        } else if (size === 4) {
            args.dword(v);
        } else {
            args.buf(v);
        }
    });
}


function calcPosAddonsSize(prop) {
    prop = prop || {};
    const addons = prop.addons || [];

    let size = 0;

    if (prop.mileage != null) {
        size += 6;
    }
    if (prop.oil != null) {
        size += 4;
    }
    if (prop.boardSpeed != null) {
        size += 4;
    }
    if (prop.alarmEvent != null) {
        size += 4;
    }

    
    addons.forEach(([id, v, v2, v3])=> {
        size += 2;
        if (id === 0x01 || id === 0x25 || id === 0x2b) {
            size += (4);
        } else if (id === 0x02 || id === 0x03 || id === 0x04 || id === 0x2a) {
            size += (2);
        } else if (id === 0x30 || id === 0x31) {
            size += (1);
        } else if (id === 0x11) {
            if (v === 0) {
                size += (1);
            } else {
                size += (5);
            }
        } else if (id === 0x12) {
            size += (6);
        } else if (id === 0x13) {
            size += (7);
        } else {
            size += (v.length);
        }
    });
    return size;
}

function codingPosAddons(args, prop) {
    prop = prop || {};
    const addons = prop.addons || [];

    if (prop.mileage != null) {
        args.byte(0x01);
        args.byte(4);
        args.dword(prop.mileage);
    }
    if (prop.oil != null) {
        args.byte(0x02);
        args.byte(2);
        args.word(prop.oil);
    }
    if (prop.boardSpeed != null) {
        args.byte(0x03);
        args.byte(2);
        args.word(prop.boardSpeed);
    }
    if (prop.alarmEvent != null) {
        args.byte(0x04);
        args.byte(2);
        args.word(prop.alarmEvent);
    }

    addons.forEach(([id, v, v2, v3])=> {
        args.byte(id);
        if (id === 0x01 || id === 0x25 || id === 0x2b) {
            args.byte(4);
            args.dword(v);
        } else if (id === 0x02 || id === 0x03 || id === 0x04 || id === 0x2a) {
            args.byte(2);
            args.word(v);
        } else if (id === 0x30 || id === 0x31) {
            args.byte(1);
            args.byte(v);
        } else if (id === 0x11) {
            if (v === 0) {
                args.byte(1);
                args.byte(v);
            } else {
                args.byte(5);
                args.byte(v);
                args.dword(v2);
            }
        } else if (id === 0x12) {
            args.byte(6);
            args.byte(v);
            args.dword(v2);
            args.byte(v3);
        } else if (id === 0x13) {
            args.byte(7);
            args.dword(v);
            args.word(v2);
            args.byte(v3);
        } else {
            args.byte(v.length);
            args.buf(v);
        }
    });
}


function codingPos28(args, prop) {
    prop = prop || {};
    args.dword(prop.alarms);
    args.dword(prop.status);
    args.dword(Math.floor(prop.lat*1000000));
    args.dword(Math.floor(prop.lng*1000000));
    args.word(prop.altitude);
    args.word(prop.speed);
    args.word(prop.direction);
    args.bcd(prop.time || '', 6);
}


function encodeCircleOrRectItem(args, item, rect) {
    let prop = item.prop || 0;

    if (item.start != null || item.end != null) {
        prop |= 0x0001;
    }
    if (item.speedLimit != null) {
        prop |= 0x0002;
    }

    args.dword(item.id);
    args.word(prop);
    args.dword(Math.floor(item.lat*1000000));
    args.dword(Math.floor(item.lng*1000000));

    if (rect) {
        args.dword(Math.floor(item.lat1*1000000));
        args.dword(Math.floor(item.lng1*1000000));
    } else {
        args.dword(item.radius);
    }

    if (prop & 0x0001) {
        args.bcd(item.start, 6);
        args.bcd(item.end, 6);
    }
    if (prop & 0x0002) {
        args.word(item.speedLimit);
        args.byte(item.speedLimitTime);
    }
}



module.exports = function(opt, prop) {

    if (opt.content === undefined) {
        switch(opt.messageId) {
            case 0x0001:
            case 0x8001:
                prop = prop || {};
                opt.content = createBuffer('word,word,byte', prop.ackSN, prop.ackId, prop.result);
                break;

            case 0x0100: {
                prop = prop || {};
                opt.content = createBuffer('word,word,buf/5,buf/20,buf/7,byte,gbk', 
                    prop.province, prop.city, prop.manufactor, prop.model, prop.termNo, prop.color, prop.license);
                break;
            }

            case 0x0102: 
                opt.content = createBuffer('str', prop);
                break;

            case 0x0104: {
                prop = prop || {};
                let args = new BufferArgs();
                args.word(prop.ackSN);
                fillParams(args, prop.params);
                opt.content = args.createBuffer();
                break;
            }

            case 0x0107: {
                prop = prop || {};
                const hw = prop.hw || '';
                const fw = prop.fw || '';
                opt.content = createBuffer('word,buf/5,buf/20,buf/7,bcd/10,szstr,szstr,byte,byte', 
                    prop.type, prop.manufactor, prop.model, prop.termNo, prop.iccid, hw, fw, prop.gnss, prop.comm);
                break;
            }

            case 0x0108:
                prop = prop || {};
                opt.content = createBuffer('byte,byte', prop.type, prop.result);
                break;

            case 0x0200: {
                prop = prop || {};
                let args = new BufferArgs();
                codingPos28(args, prop);
                codingPosAddons(args, prop);
                opt.content = args.createBuffer();
                break;
            }

            case 0x0704: {
                prop = prop || {};
                let args = new BufferArgs();
                let items = prop.items || [];
                args.word(prop.length || items.length);
                args.byte(prop.type);
                items.forEach(p=> {
                    let addsize = calcPosAddonsSize(p);
                    args.word(28+addsize);
                    codingPos28(args, p);
                    codingPosAddons(args, p);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x0705: {
                prop = prop || {};
                let args = new BufferArgs();
                let items = prop.items || [];
                args.word(prop.length || items.length);
                args.bcd(prop.time, 5);
                items.forEach(([p0, p1])=> {
                    args.dword(p0);
                    args.buf(p1, 8);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x0500:
            case 0x0201: {
                prop = prop || {};
                let args = new BufferArgs();
                args.word(prop.ackSN);
                codingPos28(args, prop);
                codingPosAddons(args, prop);
                opt.content = args.createBuffer();
                break;
            }

            case 0x0301:
                opt.content = createBuffer('byte', prop);
                break;

            case 0x0302:
                prop = prop || {};
                opt.content = createBuffer('word,byte', prop.ackSN, prop.answer);
                break;

            case 0x0303:
                prop = prop || {};
                opt.content = createBuffer('byte,byte', prop.type, prop.cancel ? 0:1);
                break;

            case 0x0702: {
                prop = prop || {};
                let args = new BufferArgs();
                args.byte(prop.on ? 0x01:0x02);
                args.bcd(prop.time, 6);
                if (prop.on) {
                    args.byte(prop.cardRead);
                    if (prop.cardRead === 0) {
                        args.szgbk(prop.driverName);
                        args.gbk(prop.license, 20);
                        args.szgbk(prop.licenseBy);
                        args.bcd(prop.expirationDate, 4);
                    }
                }
                opt.content = args.createBuffer();
                break;
            }

            case 0x0800: {
                prop = prop || {};
                opt.content = createBuffer('dword,byte,byte,byte,byte',
                    prop.mediaId, prop.type, prop.format, prop.code, prop.channel);
                break;
            }

            case 0x0801: {
                prop = prop || {};
                if (opt.packageIndex && opt.packageIndex>1) {
                    opt.content = prop.data;
                    break;
                }
                opt.content = createBuffer('dword,byte,byte,byte,byte,dword,dword,dword,dword,word,word,word,bcd/6,buf',
                    prop.mediaId, prop.type, prop.format, prop.code, prop.channel,
                    prop.alarms, prop.status, Math.floor(prop.lat*1000000), Math.floor(prop.lng*1000000),
                    prop.altitude, prop.speed, prop.direction, prop.time, prop.data);
                break;
            }

            case 0x0802: {
                prop = prop || {};
                let args = new BufferArgs();
                let items = prop.items || [];

                if (!opt.packageIndex || opt.packageIndex < 2) {
                    args.word(prop.ackSN);
                    args.word(prop.total || items.length);
                }

                
                items.forEach(item=> {
                    args.dword(item.mediaId);
                    args.byte(item.type);
                    args.byte(item.channel);
                    args.byte(item.code);
                    codingPos28(args, item);
                });

                opt.content = args.createBuffer();
                break;
            }

            case 0x0805: {
                prop = prop || {};
                let args = new BufferArgs();
                let ids = prop.ids || [];
                if (!opt.packageIndex || opt.packageIndex < 2) {
                    args.word(prop.ackSN);
                    args.byte(prop.result);
                    args.word(ids.length);
                }
                args.dwordlist(ids);
                opt.content = args.createBuffer();
                break;
            }

            case 0x8003: {
                prop = prop || {};
                let ids = prop.ids || [];
                opt.content = createBuffer('word,byte,word-list', prop.ackSN, ids.length, ids);
                break;
            }

            case 0x8100:
                prop = prop || {};
                opt.content = createBuffer('word,byte,str', prop.ackSN, prop.result, prop.token);
                break;

            case 0x8103: {
                let args = new BufferArgs();
                fillParams(args, prop);
                opt.content = args.createBuffer();
                break;
            }

            case 0x8104:
                break;

            case 0x8106:
            case 0x8601:
            case 0x8603:
            case 0x8605:
            case 0x8607: {
                const ids = prop || []; 
                opt.content = createBuffer('byte,dword-list', ids.length, ids);
                break;
            }

            case 0x8105: {
                prop = prop || {};
                let params = prop.params || '';
                if (_.isArray(params))
                    params = params.join(';');
                opt.content = createBuffer('byte,gbk', prop.cmd, params);
                break;
            }

            case 0x8108: {
                prop = prop || {};
                if (opt.packageIndex && opt.packageIndex>1) {
                    opt.content = prop.data;
                } else {
                    const ver = prop.version || '';
                    const data = prop.data ||[];
                    opt.content = createBuffer('byte,buf/5,szstr,dword,buf', 
                        prop.type, prop.manufactor, ver, prop.length || data.length, data);
                }
                break;
            }

            case 0x8202: 
                prop = prop || {};
                opt.content = createBuffer('word,dword', prop.interval, prop.duration);
                break;

            case 0x8203: 
                prop = prop || {};
                opt.content = createBuffer('word,dword', prop.ackSN, prop.type);
                break;

            case 0x8300:
                prop = prop || {};
                opt.content = createBuffer('byte,gbk', prop.flag, prop.text);
                break;
            
            case 0x8301: {
                prop = prop || {};
                let args = new BufferArgs();
                const events = prop.events || [];
                args.byte(prop.type);
                args.byte(events.length);
                events.forEach((e, i)=> {
                    let id, cnt;
                    if (typeof e === 'string') {
                        id = i;
                        cnt = e;
                    } else {
                        [id, cnt] = e;
                    }
                    args.byte(id);
                    args.szgbk(cnt);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x8302: {
                prop = prop || {};
                let args = new BufferArgs();
                const answers = prop.answers || [];
                args.byte(prop.flag);
                args.szgbk(prop.question);
                answers.forEach((e, i)=> {
                    let id, cnt;
                    if (typeof e === 'string') {
                        id = i;
                        cnt = e;
                    } else {
                        [id, cnt] = e;
                    }
                    args.byte(id);
                    args.szgbk(cnt, 2);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x8303: {
                prop = prop || {};
                let args = new BufferArgs();
                const infos = prop.infos || [];
                args.byte(prop.type);
                args.byte(infos.length);
                infos.forEach((e, i)=> {
                    let id, cnt;
                    if (typeof e === 'string') {
                        id = i;
                        cnt = e;
                    } else {
                        [id, cnt] = e;
                    }
                    args.byte(id);
                    args.szgbk(cnt, 2);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x8304:
                prop = prop || {};
                let content = iconv.encode(prop.content || '', 'gbk');
                if (opt.packageIndex && opt.packageIndex>1)
                    opt.content = content;
                else
                    opt.content = createBuffer('byte,word,buf', prop.type, prop.length || content.length, content);
                break;

            case 0x8400:
                prop = prop || {};
                opt.content = createBuffer('byte,str', prop.monitor?1:0, prop.phone);
                break;

            case 0x8401: {
                prop = prop || {};
                let args = new BufferArgs();
                const items = prop.items || [];
                args.byte(prop.type);
                args.byte(items.length);
                items.forEach(e=> {
                    args.byte(e.flag);
                    args.szstr(e.phone);
                    args.szgbk(e.name);
                });
                opt.content = args.createBuffer();
                break;
            }

            case 0x8500:
                opt.content = createBuffer('byte', prop);
                break;

            case 0x8600: {
                prop = prop || {};
                let items = prop.items || [];
                let args = new BufferArgs();
                args.byte(prop.type);
                args.byte(items.length);
                items.forEach(item=> encodeCircleOrRectItem(args, item, false));
                opt.content = args.createBuffer();
                break;
            }

            case 0x8602: {
                prop = prop || {};
                let items = prop.items || [];
                let args = new BufferArgs();
                args.byte(prop.type);
                args.byte(items.length);
                items.forEach(item=> encodeCircleOrRectItem(args, item, true));
                opt.content = args.createBuffer();
                break;
            }

            case 0x8604: {
                prop = prop || {};
                let propv = prop.prop || 0;

                if (prop.start != null || prop.end != null) {
                    propv |= 0x0001;
                }
                if (prop.speedLimit != null) {
                    propv |= 0x0002;
                }

                let args = new BufferArgs();

                args.dword(prop.id);
                args.word(propv);

                if (propv & 0x0001) {
                    args.bcd(prop.start, 6);
                    args.bcd(prop.end, 6);
                }
                if (propv & 0x0002) {
                    args.word(prop.speedLimit);
                    args.byte(prop.speedLimitTime);
                }

                let points = prop.points || [];
 
                args.word(points.length);
                points.forEach((sec)=> {
                    args.dword(Math.floor(sec.lat*1000000));
                    args.dword(Math.floor(sec.lng*1000000));
                });

                opt.content = args.createBuffer();
                break;
            }

            case 0x8606: {
                prop = prop || {};
                let propv = prop.prop || 0;

                if (prop.start != null || prop.end != null) {
                    propv |= 0x0001;
                }

                let args = new BufferArgs();

                args.dword(prop.id);
                args.word(propv);

                if (propv & 0x0001) {
                    args.bcd(prop.start, 6);
                    args.bcd(prop.end, 6);
                }

                let points = prop.points || [];
 
                args.word(points.length);
                points.forEach((sec, i)=> {
                    let t = sec.prop || 0;
                    if (sec.maxDrivingTime != null || sec.minDrivingTime != null) {
                        t |= 0x0001;
                    }
                    if (sec.speedLimit != null) {
                        t |= 0x0002;
                    }

                    const id = sec.id || (i+1);
                    const secid = sec.secId || (i+1);

                    args.dword(id);
                    args.dword(secid);
                    args.dword(Math.floor(sec.lat*1000000));
                    args.dword(Math.floor(sec.lng*1000000));
                    args.byte(sec.width);
                    args.byte(t);
                    if (t & 0x0001) {
                        args.word(sec.maxDrivingTime);
                        args.word(sec.minDrivingTime);
                    }

                    if (t & 0x0002) {
                        args.word(sec.speedLimit);
                        args.byte(sec.speedLimitTime);
                    }
                });

                opt.content = args.createBuffer();
                break;
            }

            case 0x8800: {
                prop = prop || {};
                let ids = prop.ids || [];
                opt.content = createBuffer('dword,byte,word-list', prop.mediaId, ids.length, ids);
                break;
            }

            case 0x8801: {
                prop = prop || {};
                let cmd;
                if (prop.stop) {
                    cmd = 0;
                } else if (prop.video) {
                    cmd = 0xffff;
                } else if (prop.pictures) {
                    cmd = prop.pictures;
                } else {
                    cmd = 1;
                }
                
                opt.content = createBuffer('byte,word,word,byte,byte,byte,byte,byte,byte,byte', 
                                    prop.channel, cmd, prop.duration, prop.upload?0:1, 
                                    prop.resolution, prop.quality, prop.brightness, prop.contrast, prop.saturation, prop.chroma);
                break;
            }

            case 0x8802: {
                prop = prop || {};
                opt.content = createBuffer('byte,byte,byte,bcd/6,bcd/6', 
                        prop.type, prop.channel, prop.code, 
                        prop.start, prop.end);
                break;
            }

            case 0x8803: {
                prop = prop || {};
                opt.content = createBuffer('byte,byte,byte,bcd/6,bcd/6,byte', 
                        prop.type, prop.channel, prop.code, 
                        prop.start, prop.end, prop.del ? 1:0);
                break;
            }

            case 0x8804: {
                prop = prop || {};
                let cmd;
                if (prop.stop) {
                    cmd = 0;
                } else {
                    cmd = 1;
                }
                opt.content = createBuffer('byte,word,byte,byte', 
                                    cmd, prop.duration, prop.upload?0:1, prop.frequency);
                break;
            }

            case 0x8805: {
                prop = prop || {};
                opt.content = createBuffer('dword,byte', prop.mediaId, prop.del ? 1:0);
                break;
            }

            case 0x0900:
            case 0x8900: {
                prop = prop || {};
                if (opt.packageIndex && opt.packageIndex>1)
                    opt.content = prop.data;
                else
                    opt.content = createBuffer('byte,buf', prop.type, prop.data);
                break;
            }

            case 0x0a00:
            case 0x8a00: {
                prop = prop || {};
                opt.content = createBuffer('dword,buf', prop.e, prop.n);
                break;
            }
        }
    }

    return pack(opt);
}
