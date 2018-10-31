'use strict';

//const {buildClient} = require('./helpers/client');
//const tool = require('./tool');
const {ComplexParser} = require('bindings')('complex_parser');
const encode = require('../lib/jt808/encoding/808');
const assert = require('assert');
const _ = require('lodash');


function testCoding(messageId, done, opt, prop, check) {
    opt = _.extend({
        messageId,
        imei:'12345'
    }, opt);

    
}

describe("LONG PACKAGES", function() {
    it("0x0001", function(done) {

        const parser = new ComplexParser();

        let count = 0;
        let prev = null;

        parser[ComplexParser.kOnParserError] = (err)=> {

            console.log(err);
        };

        parser[ComplexParser.kOn808MessagePrev] = (msg)=> {
            return prev;
        };

        parser[ComplexParser.kOn808Message] = (msg)=> {

            console.log(msg);
            count++;

            prev = msg;

            if (count === 3)
                done();
        };

        let d = encode({
            messageId: 0x0805,
            imei:'12345',
            packagesCount: 3,
            packageIndex: 1,
            content: Buffer.from([0x11,0x22,0xa,0x00,0x4,0x00,0x00,0x00,0x01,0x00]) 
        });
        parser.execute(d);

        d = encode({
            messageId: 0x0805,
            imei:'12345',
            packagesCount: 3,
            packageIndex: 2,
            content: Buffer.from([0x11,0x22,0xa,0x00,0x4,0x00,0x00,0x00,0x01,0x00]) 
        });
        parser.execute(d);

        d = encode({
            messageId: 0x0805,
            imei:'12345',
            packagesCount: 3,
            packageIndex: 3,
            content: Buffer.from([0x02]) 
        });
        parser.execute(d);
    });
});
