'use strict';

const _             = require('lodash');
const db            = require('../models');
const logger        = require('log4js').getLogger('main');


const Device    = db.device;
const Vehicle   = db.vehicle;
const Position  = db.position;
const VehicleStatus   = db.vehicleStatus;
const Alarm     = db.alarm;


module.exports = function(app) {

app.on('position', (peer, msg, ackTo)=> {

    const info = {
        latitude: msg.lat,
        longitude: msg.lng,
        speed: msg.speed,
        direction: msg.direction,
        altitude: msg.altitude,
        alarm_status: msg.alarms,
        status: msg.status,
        fuel: msg.oil,
        board_speed: msg.boardSpeed,
        mileage: msg.mileage,
        gps_date: msg.time
    };

    Position.create(_.assignIn({
        vehicle_id: peer.vehicle_id,
        sim_no: peer.imei,
        plate_no: peer.plate_no,
        valid: !!(msg.status & 0x02)
    }, info)).then(r=> {

        if (typeof ackTo === 'function') {
            ackTo(r);
        }
    });



    VehicleStatus.findById(peer.vehicle_id).then(v=> {
        if (v == null) {
            VehicleStatus.create(_.assignIn({
                vehicle_id: peer.vehicle_id
            }, info));
        } else {
            if (!(msg.status & 0x02)) {
                delete info.latitude;
                delete info.longitude;
                delete info.speed;
                delete info.direction;
                delete info.altitude;
            }
            v.update(info);
        }
    });

    // alarms
    let last_alarms = peer.last_alarms || 0;
    let alarms = msg.alarms;
    
    if (last_alarms !== alarms) {
        peer.last_alarms = alarms;

        for (let i=0; i<32; i++) {
            let prev = (last_alarms >> i) & 0x1;
            let cur = (alarms >> i) & 0x1;

            if (prev !== cur) {
                let off = (cur === 0);
                if (off) {
                    Alarm.findOne({
                        where: {child_type: i, status:1, vehicle_id: peer.vehicle_id},
                        order: 'id desc'
                    }).then(r=> {
                        if (r) {
                            r.update({
                                status: 2,
                                end_time: msg.time,
                                time_span: Math.floor((msg.time.getTime() - r.start_time.getTime())/1000),
                                latitude1: msg.lat,
                                longitude1: msg.lng
                            });
                        }
                    });
                } else {

                    let region_id = null;
                    if (msg.overspeedRegionType != null) {
                        region_id = msg.overspeedRegionId;
                    }
                    else if (msg.inOutRegionType != null) {
                        region_id = msg.inOutRegionId;
                    }
                    else if (msg.drivingRouteId != null) {
                        region_id = msg.drivingRouteId;
                    }

                    Alarm.create({
                        msg_sn: msg.SN,
                        child_type: i,
                        status: 1,
                        vehicle_id: peer.vehicle_id,
                        sim_no: peer.imei,
                        plate_no: peer.plate_no,
                        in_out: msg.inRegion? 1 : (msg.outRegion? 2 : null),
                        region_id: region_id,
                        driving_time: msg.drivingTime,
                        latitude: msg.lat,
                        longitude: msg.lng,
                        speed: msg.speed,
                        direction: msg.direction,
                        altitude: msg.altitude,
                        fuel: msg.oil,
                        board_speed: msg.boardSpeed,
                        mileage: msg.mileage,
                        start_time: msg.time,
                        event_id: msg.alarmEvent
                    });
                }
            }
        }
    }
});


app.on('posData', (peer, msg)=> {
    let records = msg.items.map(r=> ({
        vehicle_id: peer.vehicle_id,
        sim_no: peer.imei,
        plate_no: peer.plate_no,
        valid: !!(r.status & 0x02),
        latitude: r.lat,
        longitude: r.lng,
        speed: r.speed,
        direction: r.direction,
        altitude: r.altitude,
        alarm_status: r.alarms,
        status: r.status,
        fuel: r.oil,
        board_speed: r.boardSpeed,
        mileage: r.mileage,
        gps_date: r.time
    }));

    Position.bulkCreate(records);
});


}


// create sequence iov_alarm_id_seq increment by 1 minvalue 1 no maxvalue start with 1; 