'use strict';

const net =  require("net");
const Connection = require('./connection');

exports.createServer = function(httpListener, jt808Listener, jt809Listener, onError) {

    
    if (typeof jt808Listener !== 'function')
        jt808Listener = ()=> {};

    if (typeof jt809Listener !== 'function')
        jt809Listener = ()=> {};

    if (typeof onError !== 'function')
        onError = ()=> {};

    return net.createServer({allowHalfOpen: true}, (stream)=> {
        new Connection(stream, httpListener, jt808Listener, jt809Listener, onError);
    });
}
