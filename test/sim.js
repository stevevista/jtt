'use strict';


const {buildClient} = require('./helpers/client');
const encode = require('../src/server/jt808/encoding/808');
const fs = require('fs');
const _ = require('lodash');
const {RSA} = require('../src/server/jt808/rsa');

let SN = 1;

function write(socket, messageId, prop) {
    let d = encode({messageId, imei:'012345678906', sn: SN++}, prop);
    socket.write(d);
    return d;
}

buildClient(null, null, (socket)=> {
    write(socket, 0x0102, 'xx123');
},
(msg, socket)=> {

    console.log(msg);

    if (msg.messageId === 0x8001) {
        if (msg.result !== 0) {
            write(socket, 0x0100, {
                province: 3322,
                city: 11,
                manufactor: 'CCDDA',
                color: 2,
                license: '沪A12345'
            });
        }
    }

    else if (msg.messageId === 0x8201) {

        let d = encode({messageId:0x0201, imei:'12345', sn:2}, {
            ackSN: msg.SN,
            alarms: 0xff,
            status: 2,
            lat: 121.334,
            time: '1107211532',
            altitude: 1,
            speed: 2,
            direction: 3,
            milage: 999,
            oil: 888,
            boardSpeed: 777,
            alarmEvent: 666,
            addons: [[0x13, 99, 12, 0]]
        });

        socket.write(d);
    }
    else if (msg.messageId === 0x8702) {

        let d = encode({messageId:0x0702, imei:'12345', sn:2}, {
            on:true,
            time: '1107211532',
            cardRead: 0,
            driverName: '慧慧',
            license: 'ABCD1234',
            licenseBy: '中华人民共和国',
            expirationDate: '20131112'
        });

        socket.write(d);
    }
    else if (msg.messageId === 0x8802) {

        let d = encode({messageId:0x0802, imei:'12345', packagesCount:3, packageIndex:1}, {
            ackSN: msg.SN,
            total: 4,
            items: [
                {
                    mediaId: 99,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.334,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                },
                {
                    mediaId: 88,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.314,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                }
            ]
        });

        socket.write(d);

        d = encode({messageId:0x0802, imei:'12345', packagesCount:3, packageIndex:3}, {
            items: [
                {
                    mediaId: 77,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.334,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                },
                {
                    mediaId: 66,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.314,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                }
            ]
        });

        socket.write(d);
    }

    else if (msg.messageId === 0x8003) {

        let d = encode({messageId:0x0802, imei:'12345', packagesCount:3, packageIndex:2}, {
            ackSN: msg.SN,
            total: 4,
            items: [
                {
                    mediaId: 55,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.334,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                },
                {
                    mediaId: 44,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.314,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                }
            ]
        });

        socket.write(d);

        d = encode({messageId:0x0802, imei:'12345', packagesCount:3, packageIndex:3}, {
            items: [
                {
                    mediaId: 33,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.334,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                },
                {
                    mediaId: 22,
                    type: 11,
                    channel: 22,
                    code: 33,
                    status: 2,
                    lat: 121.314,
                    time: '1107211532',
                    altitude: 1,
                    speed: 2,
                    direction: 3,
                    milage: 999,
                    oil: 888,
                    boardSpeed: 777,
                    alarmEvent: 666
                }
            ]
        });

        socket.write(d);
    }

    else if (msg.messageId === 0x8805) {
        
        let d = encode({messageId:0x0001, imei:'12345'}, {
            ackSN: msg.SN,
            ackId: msg.messageId
        });
        
        socket.write(d);

        const K = 819;

        const fd = fs.openSync('doc/JTT808.pdf', 'r');
        const stat = fs.fstatSync(fd);
        const packagesCount = Math.ceil((stat.size+36)/K);
        const buffer = Buffer.allocUnsafe(K);
        let hdrsize = 36;

        buffer[0] = 0;
        buffer[1] = 0;
        buffer[2] = 0;
        buffer[3] = 1;

        for (let packageIndex=1; packageIndex<=packagesCount; packageIndex++) {
            let cntSize = fs.readSync(fd, buffer, hdrsize, K-hdrsize);
            let content = buffer;
            if (cntSize) {
                if ((cntSize+hdrsize) < K)
                    content = buffer.slice(0, cntSize+hdrsize);

                let d = encode({messageId:0x0801, imei:'12345', packagesCount, packageIndex, content});
                socket.write(d);
            }
            hdrsize = 0;
        }
    }

    else if (msg.messageId === 0x8a00) {
        write(socket, 0x0a00, RSA);
    }

    else if (msg.messageId === 0x8e00) {
        if(msg._raw[0] === 1) {
            ack(socket, msg);
            write(socket, 0x0301, 87);
        } else if(msg._raw[0] === 2)
            write(socket, 0x0200, {
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
            });
        else
            ack(socket, msg);
    }
    else if (msg.messageId === 0x8104 || msg.messageId === 0x8106) {
        write(socket, 0x0104, {
                ackSN: msg.SN,
                params: [
                [0x0017, 'backup adrr'],
                [0x0018, 1883]
            ]
        });
    }
    else if (msg.messageId === 0x8107) {
        write(socket, 0x0107, {
            manufactor: 'CCDDA',
            hw: 'LC.2.10.00',
            comm: 0xef
        });
    }
    else if (msg.messageId === 0x8108) {
        write(socket, 0x0108, {
            type: msg.type
        });
    }
    else {
        ack(socket, msg);
    }
});


function ack(socket, msg) {
    write(socket, 0x0001, {
        ackSN: msg.SN,
        ackId: msg.messageId
    });
}
