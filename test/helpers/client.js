'use strict';

const net = require('net');
const {ComplexParser} = require('../../lib/jt808/package');

const HOST = '127.0.0.1';
const PORT = 3000;

function buildClient(port, host, onConnect, onMessage, onError) {

    port = port || PORT;
    host = host || HOST;

    const socket = new net.Socket();
    socket.connect(port, host, function() {

        const parser = new ComplexParser();
        parser[ComplexParser.kOn808Message] = (msg)=> {
            if (typeof onMessage === 'function') {
                onMessage(msg, socket);
            }
        };

        parser[ComplexParser.kOnParserError] = (err)=> {
            if (typeof onError === 'function') {
                onError(err, socket);
            } else {
                console.error(err);
            }
        };

        socket.on('data', (d)=> {
            parser.execute(d);
        });

        

        onConnect(socket);
    });

    socket.on('error', (err)=> {
        if (typeof onError === 'function') {
            onError(err, socket);
        } else {
            console.error(err);
        }
    });
}

exports.buildClient = buildClient;
