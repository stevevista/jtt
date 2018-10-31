'use strict';

const _             = require('lodash');
const db            = require('../models');
const logger        = require('log4js').getLogger('main');

const Device    = db.device;
const Vehicle   = db.vehicle;
const Position  = db.position;
const VehicleStatus   = db.vehicleStatus;


module.exports = function(app) {

app.on('offline', (peer)=> {
    if (peer.vehicle_id) {
        VehicleStatus.update({online: false}, {where: {vehicle_id: peer.vehicle_id}});
    }
});


app.on('auth', (peer, token, next)=> {

    Device.findOne({
        include: [{model: Vehicle}],
        where: {sim_no: peer.imei}
    }).then(r=> {
        if (r == null) {
            logger.error(`[${peer.imei}] not exists`);
            return next(1);
        }
        if (r.vehicle == null) {
            logger.error(`[${peer.imei}] not installed on any vehicle`);
            return next(1);
        }

        peer.vehicle_id = r.vehicle_id;
        peer.plate_no = r.vehicle.plate_no;
        VehicleStatus.update({online: true}, {where: {vehicle_id: r.vehicle_id}});
        logger.info(`[${peer.imei}] on ${peer.plate_no} authed`);
        next(0);
    });
});


app.on('register', (peer, msg, next)=> {

    Device.findOne({
        include: [{model: Vehicle}],
        where: {sim_no: peer.imei}
    }).then(r=> {
        if (r == null) {
            return next(4);
        }
        if (r.vehicle) {
            if (r.vehicle.plate_no === msg.license) {
                peer.vehicle_id = r.vehicle_id;
                peer.plate_no = r.vehicle.plate_no;
                VehicleStatus.update({online: true}, {where: {vehicle_id: peer.vehicle_id}});
                return next(0, 'leadcore');
            } else
                return next(3);
        }

        Vehicle.findOne({
            include: [{model: Device}],
            where: {plate_no: msg.license}
        }).then(v=> {
            if (v == null) {
                return next(2);
            }
            if (v.device) {
                return next(1);
            }

            r.setVehicle(v).then(()=> {
                peer.vehicle_id = v.id;
                peer.plate_no = v.plate_no;
                VehicleStatus.update({online: true}, {where: {vehicle_id: peer.vehicle_id}});
                return next(0, 'leadcore');
            });
        })
    });
});


app.on('unregister', (peer, msg)=> {

    delete peer.vehicle_id;
    delete peer.plate_no;

    Device.findOne({
        where: {sim_no: peer.imei}
    }).then(r=> {
        if (r == null) {
            return;
        }
        r.update({
            vehicle_id: null 
        });
    });
});


}










