'use strict';

//const {buildClient} = require('./helpers/client');
//const tool = require('./tool');
const {ComplexParser} = require('bindings')('complex_parser');
const encode = require('../lib/jt808/encoding/808');
const assert = require('assert');
const _ = require('lodash');
const {RSA} = require('../lib/jtt/rsa');


function testCoding(messageId, done, opt, prop, check) {
    opt = _.extend({
        messageId,
        imei:'12345'
    }, opt);

    const parser = new ComplexParser();

    if (opt.e)
        parser.setDecRSA(RSA.e, RSA.n, RSA.d);

    parser[ComplexParser.kOn808Message] = (msg)=> {
        if (opt.print)
            console.log(msg);

        if (typeof opt.format === 'function') {
            opt.format(msg);
        }

        if (typeof check === 'function')
            check(msg);
        else if (_.isArray(check)) {
            prop = prop || {};
            for (let k of check) {
                assert.deepEqual(prop[k], msg[k]);
            }
        } else {
            prop = prop || {};
            for (let k in prop) {
                assert.deepEqual(prop[k], msg[k]);
            }
        }
        done();
    };

    let d = encode(opt, prop);
    //if (messageId === 0x8604) console.log(d);
    parser.execute(d);
}

describe("parser", function() {
    it("0x0001", function(done) {
        testCoding(0x0001, done, {}, {
            ackSN:76, ackId: 54, result:8
        });
    });
    it("0x8001", function(done) {
        testCoding(0x8001, done, {}, {
            ackSN:3, ackId: 0x7001, result:1
        });
    });
    it("0x8003", function(done) {
        testCoding(0x8003, done, {}, {
            ids: [1,2,3,4,5]
        });
    });
    it("0x0100", function(done) {
        testCoding(0x0100, done, {}, {
            province: 3322,
            city: 11,
            manufactor: 'CCDDA',
            model: 'Xbc',
            color: 2,
            license: '中文'
        });
    });
    it("0x8100", function(done) {
        testCoding(0x8100, done, {}, {
            result: 4,
            token: 'stevesdfsdfdsfsdfsfsdfdgfdgfdhffghfjhgjkgljhlkjljkljk;jh;j;jk;jk;jhkjhljkhkhkjhgkjgjgjgjgjgj'
        });
    });
    it("0x0102", function(done) {
        const token = 'xfdsfsdfsffx  vc  cxvfgdgdgdfgb cvcxv';
        testCoding(0x0102, done, {}, token, (msg)=> {
            assert.equal(msg.token, token);
        });
    });
    it("0x8103", function(done) {
        const params = [
                [0x0017, 'backup adrr'],
                [0x0018, 1883]
            ];
        testCoding(0x8103, done, {}, params, (msg)=> {
            assert.deepEqual(msg.params, params);
        });
    });
    it("0x8106", function(done) {
        testCoding(0x8106, done, {}, [5,4,3,2,1], (msg)=> {
            assert.deepEqual(msg.ids, [5,4,3,2,1]);
        });
    });
    it("0x0104", function(done) {
        testCoding(0x0104, done, {}, {
            ackSN: 33,
            params: [
                [0x0017, 'backup adrr'],
                [0x0018, 1883]
            ]
        });
    });
    it("0x0104-rsa", function(done) {
        testCoding(0x0104, done, {e:RSA.e, n:RSA.n}, {
            ackSN: 33,
            params: [
                [0x0017, 'backup adrr'],
                [0x0018, 1883]
            ]
        });
    });
    it("0x8105", function(done) {
        testCoding(0x8105, done, {}, {
            cmd: 4,
            params: [
                'kit',
                '参数'
            ].join(';')
        });
    });
    it("0x0107", function(done) {
        testCoding(0x0107, done, {}, {
            manufactor: 'CCDDA',
            iccid: '01234567890123456789',
            hw: 'LC.2.10.00',
            comm: 0xef
        });
    });
    it("0x8108", function(done) {
        testCoding(0x8108, done, {}, {
            type: 9,
            manufactor: 'abcde',
            version: '1.2.30',
            data: Buffer.from([2,3,4])
        });
    });
    it("0x0108", function(done) {
        testCoding(0x0108, done, {}, {
            type: 8,
            result:2
        });
    });
    it("0x0200", function(done) {
        testCoding(0x0200, done, {}, {
            status: 2,
            lat: 121.334,
            time: '1107211532',
            altitude: 1,
            speed: 2,
            direction: 3,
            mileage: 999,
            oil: 888,
            boardSpeed: 777,
            alarmEvent: 666,
            addons: [[0x13, 99, 12, 0]]
        }, ['status', 'lat', 'altitude', 'speed', 'direction', 'milage', 'oil', 'boardSpeed', 'alarmEvent']);
    });
    it("0x0201", function(done) {
        testCoding(0x0201, done, {}, {
            ackSN: 66,
            status: 2,
            lat: 121.334,
            time: '1107211532',
            altitude: 1,
            speed: 2,
            direction: 3,
            mileage: 999,
            oil: 888,
            boardSpeed: 777,
            alarmEvent: 666,
            addons: [[0x13, 99, 12, 0]]
        }, ['ackSN', 'status', 'lat', 'altitude', 'speed', 'direction', 'milage', 'oil', 'boardSpeed', 'alarmEvent']);
    });
    it("0x0704", function(done) {
        testCoding(0x0704, done, {
            format: function(msg) {
                msg.items[0].time = fmt_time6(msg.items[0].time);
                msg.items[1].time = fmt_time6(msg.items[1].time);
            }
        }, {
            type: 112,
            items: [
                {   alarms:0,
                    status: 2,
                    lat: 121.334,
                    lng: 0,
                    time: '110721153200',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    mileage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666,
                    addons: [[0x14, Buffer.from([0xa,0xb])]]
                },
                {   alarms:0,
                    status: 2,
                    lat: 121.334,
                    lng: 0,
                    time: '110721153200',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    mileage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666,
                    addons: [[0x14, Buffer.from([0xa,0xb])]]
                }
            ]
        });
    });
    it("0x0705", function(done) {
        testCoding(0x0705, done, {}, {

            items: [[1, Buffer.from([1,2,3,4,5,6,7,8])], [2, Buffer.from([1,2,3,4,5,6,7,8])]]
        });
    });
    it("0x8202", function(done) {
        testCoding(0x8202, done, {}, {
            interval: 44,
            duration: 0xffeecc
        });
    });
    it("0x8203", function(done) {
        testCoding(0x8203, done, {}, {
            ackSN: 0x77,
            type: 998
        });
    });
    it("0x8300", function(done) {
        testCoding(0x8300, done, {}, {
            flag: 0x77,
            text: '种种特点'
        });
    });
    it("0x8301", function(done) {
        testCoding(0x8301, done, {}, {
            type: 113,
            events: [[1, '种种特点'], [12, '种种abc']]
        });
    });/*
    it("0x0301", function(done) {
        testCoding(0x0301, done, {}, 23, (msg)=> {
            assert.equal(msg.event, 23);
        });
    });*/
    it("0x8302", function(done) {
        testCoding(0x8302, done, {}, {
            flag: 113,
            question: 'whats fuck',
            answers: [[1, '种种特点'], [12, '种种abc']]
        });
    });
    it("0x0302", function(done) {
        testCoding(0x0302, done, {}, {
            ackSN: 99,
            answer: 4
        });
    });
    it("0x8303", function(done) {
        testCoding(0x8303, done, {}, {
            type: 113,
            infos: [[1, '种种特点'], [12, '种种abc']]
        });
    });
    it("0x0303", function(done) {
        testCoding(0x0303, done, {}, {
            type: 11,
            cancel:false
        });
    });
    it("0x8304", function(done) {
        testCoding(0x8304, done, {}, {
            type: 113,
            //length: 8,
            content: '种种abc'
        });
    });
    it("0x0702", function(done) {
        testCoding(0x0702, done, {
            format: function(msg) {
                msg.time = fmt_time6(msg.time, 10);
                msg.expirationDate = fmt_time4(msg.expirationDate);
            }
        }, {
            on:true,
            time: '1107211532',
            cardRead: 0,
            driverName: '慧慧',
            license: 'ABCD1234',
            licenseBy: '中华人民共和国',
            expirationDate: '20131112'
        });
    });
    it("0x8400", function(done) {
        testCoding(0x8400, done, {}, {
            monitor: true,
            phone:'121111'
        });
    });
    it("0x8401", function(done) {
        testCoding(0x8401, done, {}, {
            type: 113,
            items: [{flag:1, phone:'138771', name:'种种特点'}, {flag:2, phone:'121111', name:'种种abc'}]
        });
    });
    it("0x8500", function(done) {
        testCoding(0x8500, done, {}, 11, (msg)=> {
            assert.equal(msg.flag, 11);
        });
    });
    it("0x8600", function(done) {
        testCoding(0x8600, done, {
            //print:true,
            format: function(msg) {
                msg.items[0].start = fmt_time6(msg.items[0].start);
                msg.items[0].end = fmt_time6(msg.items[0].end);
            }
        }, {
            type: 1,
            items: [
                {
                    id: 11, prop: 1, lat: 0.223, lng: 1.224, radius:8, start: '101221000000', end: '130701152111'
                }, 
                {
                    id: 22, prop: 2, lat: 0.225, lng: 1.226, radius:9, speedLimit: 88, speedLimitTime: 26
                },
                {
                    id: 33, prop: 0, lat: 0.227, lng: 1.228, radius:10
                }
            ]
        });
    });
    it("0x8602", function(done) {
        testCoding(0x8602, done, {
            format: function(msg) {
                msg.items[0].start = fmt_time6(msg.items[0].start);
                msg.items[0].end = fmt_time6(msg.items[0].end);
            }
        }, {
            type: 1,
            items: [
                {
                    id: 11, prop: 1, lat: 0.223, lng: 1.224, lat1:81.33, lng1:3.3, start: '101221000000', end: '130701152111'
                }, 
                {
                    id: 22, prop: 2, lat: 0.225, lng: 1.226, lat1:81.33, lng1:3.3, speedLimit: 88, speedLimitTime: 26
                },
                {
                    id: 33, prop: 0, lat: 0.227, lng: 1.228, lat1:81.33, lng1:3.3
                }
            ]
        });
    });
    it("0x8601", function(done) {
        testCoding(0x8601, done, {}, [5,4,3,2,1], (msg)=> {
            assert.deepEqual(msg.ids, [5,4,3,2,1]);
        });
    });
    it("0x8604", function(done) {
        testCoding(0x8604, done, {}, {
            id:1234567,
            prop: 3,
            start: '101221',
            end: '130701152111',
            speedLimit: 54321,
            speedLimitTime: 55,
            points: [
                {
                    lat: 0.02334,
                    lng: 12.1165
                },
                {
                    lat: 0.02334,
                    lng: 12.1165
                }
            ]
        }, ['speedLimitTime','prop','points']);
    });
    it("0x8606", function(done) {
        testCoding(0x8606, done, {}, {
            id:1234567,
            prop: 1,
            start: '101221',
            end: '130701152111',
            points: [
                {
                    id: 2,
                    secId: 3,
                    lat: 0.02334,
                    lng: 12.1165,
                    width: 44,
                    prop: 0
                },
                {
                    id: 4,
                    secId: 5,
                    lat: 0.02334,
                    lng: 12.1165,
                    width: 44,
                    prop: 3,
                    maxDrivingTime: 77,
                    minDrivingTime: 42,
                    speedLimit: 54321,
                    speedLimitTime: 55
                }
            ]
        }, ['prop','points']);
    });

    it("0x8801", function(done) {
        testCoding(0x8801, done, {}, {
            channel: 6,
            pictures: 101,
            upload: true,
            chroma: 88
        });
    });
    it("0x0800", function(done) {
        testCoding(0x0800, done, {
        }, {
            mediaId: 46,
            type: 7,
            format: 6,
            code: 5,
            channel: 4
        });
    });
    it("0x0801", function(done) {
        testCoding(0x0801, done, {
            format: function(msg) {
                msg.time = fmt_time6(msg.time, 6);
            }
        }, {
            mediaId: 46,
            type: 7,
            format: 6,
            code: 5,
            channel: 4,
            alarms: 0xee,
            status: 0xbb,
            lat: 33.115,
            lng: 21.405614,
            altitude: 62832,
            speed: 721,
            direction: 0,
            time: '110101',
            data: Buffer.from([44,22,11])
        });
    });
    it("0x0802", function(done) {
        testCoding(0x0802, done, {
            format: function(msg) {
                msg.items[0].time = fmt_time6(msg.items[0].time);
                msg.items[1].time = fmt_time6(msg.items[1].time);
            }
        }, {
            ackSN: 55,
            items: [
                {   alarms: 3,
                    mediaId: 99,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.334,
                    lng:0,
                    time: '110721153200',
                    altitude: 1,
                    speed: 2,
                    direction: 3
                },
                {   alarms: 31,
                    mediaId: 88,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.314,
                    lng:0,
                    time: '110721153200',
                    altitude: 1,
                    speed: 2,
                    direction: 3
                }
            ]
        });
    });
    it("0x8802", function(done) {
        testCoding(0x8802, done, {
            format: function(msg) {
                msg.start = fmt_time6(msg.start);
                msg.end = fmt_time6(msg.end);
            }
        }, {
            type: 9,
            channel: 6,
            code: 101,
            start: '991201000000',
            end: '931201000000'
        });
    });
    it("0x8803", function(done) {
        testCoding(0x8803, done, {}, {
            type: 9,
            channel: 6,
            code: 101,
            del: true,
            start: '991201',
            end: '931201'
        }, ['type', 'channel', 'code', 'del']);
    });
    it("0x8804", function(done) {
        testCoding(0x8804, done, {}, {
            stop: true, 
            duration: 130, 
            upload: true,
            frequency: 1
        });
    });
    it("0x8805", function(done) {
        testCoding(0x8805, done, {}, {
            mediaId: 121, 
            del: true
        });
    });
    it("0x0900", function(done) {
        testCoding(0x0900, done, {}, {
            type: 32,
            data: Buffer.from([5,4,3,1,2])
        });
    });
    it("0x8900", function(done) {
        testCoding(0x8900, done, {}, {
            type: 165,
            data: Buffer.from([5,4,3,2,2])
        });
    });
    it("0x0a00", function(done) {
        testCoding(0x0a00, done, {}, {
            e: 32,
            n: Buffer.from([5,4,3,1,2])
        });
    });
    it("0x8a00", function(done) {
        testCoding(0x8a00, done, {}, {
            e: 32765,
            n: Buffer.from([5,4,3,2,2])
        });
    });
});





function fmt_time4(d) {

    function fmtd(d) {
        if (d<10) return '0'+d;
        return ''+d;
    }

    let s =  `${fmtd(d.getFullYear())}${fmtd(d.getMonth()+1)}${fmtd(d.getDate())}`;
    return s;
}



function fmt_time6(d, ln=12) {

    function fmtd(d) {
        if (d<10) return '0'+d;
        return ''+d;
    }

    let s =  `${fmtd(d.getFullYear()-2000)}${fmtd(d.getMonth()+1)}${fmtd(d.getDate())}${fmtd(d.getHours())}${fmtd(d.getMinutes())}${fmtd(d.getSeconds())}`;
    return s.slice(0, ln);
}
