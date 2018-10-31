'use strict';

const net =  require("net")
const Connection = require('./connection')

exports.createServer = function(jt808Listener, onError = () => {}) {

    if (typeof jt808Listener !== 'function')
        jt808Listener = ()=> {};

    return net.createServer({allowHalfOpen: true}, (stream)=> {
        new Connection(stream, jt808Listener, onError)
    })
}
