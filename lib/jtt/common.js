'use strict';

const _             = require('lodash');
const db            = require('../models');
const logger        = require('log4js').getLogger('main');

const Device    = db.device;
const Vehicle   = db.vehicle;
const Position  = db.position;
const VehicleStatus   = db.vehicleStatus;


module.exports = function(app) {

app.on('parameters', (peer, params)=> {
    console.log(params);
});


}
