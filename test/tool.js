'use strict';

const {ComplexParser} = require('bindings')('complex_parser');
const encode = require('../lib/jt808/encoding/809');
const assert = require('assert');
const _ = require('lodash');

const sn = 2;
const encryptKey = 0;

const VERSION = '1.2.3.4';


function testCoding(messageId, done, opt, prop, check) {
    opt = _.extend({
        messageId,
        version:VERSION,
        centerId:0x888ab
    }, opt);

    const parser = new ComplexParser();

    parser[ComplexParser.kOn809Message] = (msg)=> {
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

    parser[ComplexParser.kOnParserError] = (err)=> {
        console.log(err);
    }

    let d = encode(opt, prop);
    //console.log(d);
    parser.execute(d);
}

const M1  = 0xfffa;
const IA1 = 0xfffb;
const IC1 = 0xfffc;


describe("parser 809", function() {

    it("0x1001", function(done) {
        testCoding(0x1001, done, {}, {
            userId: 0xffabcdef,
            password: 'abcd.123',
            ip: '127.0.0.1',
            port: 1886
        });
    });
    it("0x9204/0x1601", function(done) {
        testCoding(0x9204, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            VIN:81,
            TT1 : 44,
            XX:''
        });
    });
    it("0x1302", function(done) {
        testCoding(0x1302, done, {}, {
            type: 5,
            infoId: 0xabcdef
        });
    });
    it("0x1301/0x9301/0x9302", function(done) {
        testCoding(0x9301, done, {}, {
            type: 5,
            objectType : 44,
            objectId: 'ABCDEFG',
            infoId: 0xabcdef,
            content: 'dfgdfg'
        });
    });
    it("0x1401", function(done) {
        testCoding(0x1401, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            supervisionId: 44,
            result: 1
        });
    });
    it("0x1402", function(done) {
        testCoding(0x1402, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            warnSrc: 44,
            warnType: 1,
            warnTime: new Date(1263085674*1000),
            infoId: 0xabcdef,
            content: 'dfgdfg'
        });
    });
    it("0x1403", function(done) {
        testCoding(0x1403, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            infoId: 44,
            result: 1
        });
    });
    it("0x9401", function(done) {
        testCoding(0x9401, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            warnSrc: 44,
            warnType: 1,
            warnTime: new Date(1263085674*1000),
            supervisionId: 44,
            endTime: new Date(1263085674*1000),
            level: 8,
            supervisor: 'zrj',
            phoneNumber: '13761833959',
            email: 'stevevista@gmail.com'
        });
    });
    it("0x9402/0x9403", function(done) {
        testCoding(0x9402, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            warnSrc: 44,
            warnType: 1,
            warnTime: new Date(1263085674*1000),
            content: 'dfgdfg'
        });
    });
    it("0x1502", function(done) {
        testCoding(0x1502, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            flag: 2,
            encrypt: 2,
            time: new Date(1263085674*1000),
            lng: 0.337,
            lat: 121.88,
            speed: 3234,
            boardSpeed: 3236,
            mileage: 0xfffff,
            direction: 99,
            altitude: 88,
            status: 1234124,
            alarms: 324321,
            sizeType: 2,
            format: 6,
            lensId: 5,
            data: Buffer.from([0xee, 1,2,3,4,5,6])
        });
    });
    it("0x1503", function(done) {
        testCoding(0x1503, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            ackId: 4488,
            result: 1
        });
    });
    it("0x1504", function(done) {
        testCoding(0x1504, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 5,
            cmd: 44,
            travelData: 'sdfesrgdsfhdfg'
        });
    });
    it("0x9205/0x9206/0x9207/0x9208/0x9209/0x1501/0x1505", function(done) {
        testCoding(0x9206, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            result : 44
        });
    });
    it("0x9501", function(done) {
        testCoding(0x9501, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            phoneNumber : '1376183395X'
        });
    });
    it("0x9502", function(done) {
        testCoding(0x9502, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            lensId : 243,
            sizeType: 1
        });
    });
    it("0x9503", function(done) {
        testCoding(0x9503, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            sequence : 0xeff22,
            priority: 45,
            content: '自自在在在'
        });
    });
    it("0x9504", function(done) {
        testCoding(0x9504, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            cmd : 44
        });
    });
    it("0x9505", function(done) {
        testCoding(0x9505, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            authCode: 'abcdefghij',
            accessPoint: 'leadcore',
            username: 'lc',
            password: 'abcd.1234',
            serverIp: '127.0.0.3',
            udpPort: 445,
            tcpPort: 1887,
            endTime: new Date(1263085674*1000)
        });
    });
    it("0x1002", function(done) {
        testCoding(0x1002, done, {}, {
            result: 2,
            code: 1886
        });
    });
    it("0x1003", function(done) {
        testCoding(0x1003, done, {}, {
            userId: 0xffabcdef,
            password: 'abcd.123'
        });
    });
    it("0x1004", function(done) {
        testCoding(0x1004, done, {}, {
        });
    });
    it("0x1007", function(done) {
        testCoding(0x1007, done, {}, 12, (msg)=> {
            assert.equal(msg.code, 12);
        });
    });
    it("0x9001", function(done) {
        testCoding(0x9001, done, {}, 0xabcdef, (msg)=> {
            assert.equal(msg.code, 0xabcdef);
        });
    });
    it("0x9002", function(done) {
        testCoding(0x9002, done, {}, 12, (msg)=> {
            assert.equal(msg.result, 12);
        });
    });
    it("0x9101", function(done) {
        testCoding(0x9101, done, {}, {
            total: 12000,
            start: new Date(1263085674*1000)
        });
    });
    it("0x1201", function(done) {
        testCoding(0x1201, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            platformId: 'abcdef',
            producerId: 'producerId',
            model: 'model',
            terminalId: '1234567',
            simno: '0123456789ab'
        });
    });
    it("0x1202", function(done) {
        testCoding(0x1202, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            encrypt: 2,
            time: new Date(1263085674*1000),
            lng: 0.337,
            lat: 121.88,
            speed: 3234,
            boardSpeed: 3236,
            mileage: 0xfffff,
            direction: 99,
            altitude: 88,
            status: 1234124,
            alarms: 324321
        });
    });
    it("0x1203/0x9203", function(done) {
        testCoding(0x1203, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            items: [
                {
                    encrypt: 2,
                    time: new Date(1263085674*1000),
                    lng: 0.337,
                    lat: 121.88,
                    speed: 3234,
                    boardSpeed: 3236,
                    mileage: 0xfffff,
                    direction: 99,
                    altitude: 88,
                    status: 1234124,
                    alarms: 324321
                },
                {
                    encrypt: 2,
                    time: new Date(1263085674*1000),
                    lng: 0.337,
                    lat: 121.88,
                    speed: 3234,
                    boardSpeed: 3236,
                    mileage: 0xfffff,
                    direction: 99,
                    altitude: 88,
                    status: 1234126,
                    alarms: 324321
                }
            ]
        });
    });
    it("0x1600", function(done) {
        testCoding(0x1600, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88
        });
    });
    it("0x1207/0x1209", function(done) {
        testCoding(0x1209, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            start: new Date(1263085674*1000),
            end: new Date(1263085675*1000)
        });
    });
    it("0x120a/0x120c", function(done) {
        testCoding(0x120a, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 88,
            driverName: '其器官',
            orgName: 'sadfdsfgsdgsdfg'
        });
    });
    it("0x120b/0x120d", function(done) {
        testCoding(0x120b, done, {}, {
            plateNo: 'ABC12345',
            color: 0x99,
            type: 87,
            data: Buffer.from([0xee, 1,2,3,4,5,7])
        });
    });
});
