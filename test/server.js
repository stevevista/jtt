'use strict';

const net =  require("net");
const _             = require('lodash');
const {ComplexParser} = require('bindings')('complex_parser');
const encode = require('../lib/jt808/encoding/809');


let sn = 2;
const encryptKey = 0;
const VERSION = '1.2.3.4';


function writeMsg(socket, messageId, prop, opt) {
    opt = _.extend({
        sn: sn++,
        messageId,
        version:VERSION,
        centerId:0x888ab
    }, opt);

    let d = encode(opt, prop);
    return socket.write(d);
}


const svr = net.createServer({}, (socket)=> {

    const parser = new ComplexParser();

    parser[ComplexParser.kOn809Message] = (msg)=> {
        console.log(msg);

        if (msg.messageId === 0x1001) {
            writeMsg(socket, 0x1002, {result:0, code:0xabcd});
        }
    };

    socket.on('data', (d)=> {
        parser.execute(d);
    });
});

svr.listen(8877);

