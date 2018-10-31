'use strict';

const {RSA} = require('../rsa');

module.exports = function(app) {

app.on('offline', (info)=> {
    console.log(`[${info.imei}] offline: `.bgGreen);
});

app.on('lostHeartBeat', (info, interval, next)=> {
    console.log(`[${info.imei}] lostHeartBeat: ${interval}`.bgGreen);
    next(true);
});

app.on('auth', (info, token, next)=> {
    console.log(`[${info.imei}] auth: ${token}`.bgGreen);
    next(1);
});

app.on('rsa', (info, rsa, next)=> {
    console.log(`[${info.imei}] rsa: ${JSON.stringify(rsa)}`.bgGreen);
    if (typeof next === 'function') {
        next(RSA);
    }
});

app.on('register', (info, msg, next)=> {
    console.log(`[${info.imei}] register: ${JSON.stringify(msg)}`.bgGreen);
    next(0, 'leadcore');
});

app.on('unregister', (info)=> {
    console.log(`[${info.imei}] unregister: `.bgGreen);
});

app.on('params', (info, params)=> {
    console.log(`[${info.imei}] params: ${params}`.bgGreen);
});

app.on('properties', (info, property)=> {
    console.log('prop pint'.bgRed);
    console.log(`[${info.imei}] params: ${JSON.stringify(property)}`.bgGreen);
});

app.on('position', (info, msg, next)=> {
    console.log(`[${info.imei}] position: ${JSON.stringify(msg)}`.bgGreen);
    if (typeof next === 'function') {
        next(88);
    }
});

app.on('event', (info, e)=> {
    console.log(`[${info.imei}] event: ${e}`.bgGreen);
});

app.on('infoDemand', (info, msg)=> {
    console.log(`[${info.imei}] infoDemand: ${JSON.stringify(msg)}`.bgGreen);
});

}
