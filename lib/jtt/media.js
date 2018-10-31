'use strict';

const _             = require('lodash');
const fs            = require('fs');
const db            = require('../models');
const {createOrUpdate} = require('./helper');
const logger        = require('log4js').getLogger('main');


const Media         = db.media;
const Request       = db.request;

const FORMATS = ['.jpeg', '.tif', '.mp3', '.wav', '.wmv'];


function assignMediaRecord(peer, src) {
    let out = {
            sim_no: peer.imei,
            vehicle_id: peer.vehicle_id,
            plate_no: peer.plate_no,
            media_id: src.mediaId,
            channel: src.channel,
            type: src.type,
            event_code: src.code,
            latitude: src.lat,
            longitude: src.lng,
            status: src.status,
            gps_date: src.time,
            speed: src.speed,
            direction: src.direction,
            altitude: src.altitude,
            alarm_status: src.alarms
    };

    if (src.format != null) {
        out.format = src.format;
    }

    return out;
}

module.exports = function(app) {

app.on('mediaEvent', (peer, msg)=> {

    createOrUpdate(Media, {
        sim_no: peer.imei,
        vehicle_id: peer.vehicle_id,
        plate_no: peer.plate_no,
        media_id: msg.mediaId,
        type: msg.type,
        format: msg.format,
        event_code: msg.code,
        channel: msg.channel
    }, ['sim_no', 'media_id']);
});


app.on('medias', (peer, msg)=> {

    msg.items.forEach(item=> {
        createOrUpdate(Media, assignMediaRecord(peer, item), ['sim_no', 'media_id']);
    });

});

app.on('mediaFile', (peer, f)=> {
    f._filename = `${peer.imei}_${f.mediaId}_file${FORMATS[f.format]||'.data'}`;
    f._io = new Promise((resolve, reject)=> {
        fs.open(`store/${f._filename}`, 'w+', (err, fd)=> {
            if (err)reject(err);
            else resolve(fd);
        });
    });

    f.on('data', d=> {
        f._io = f._io.then((fd)=> {
            return new Promise((resolve, reject)=> {
                fs.write(fd, d, 0, d.length, (err)=> {
                    if (err)reject(err);
                    else resolve(fd);
                });
            });
        });
    })

    f.on('end', d=> {

        f._io = f._io.then((fd)=> {
            return new Promise((resolve, reject)=> {
                fs.write(fd, d, 0, d.length, (err)=> {
                    if (err)reject(err);
                    else {
                        fs.close(fd, ()=> {
                            resolve(null);
                        });
                    }
                });
            });
        });

        f._io.then(()=> {
                    
            let insertMedia = createOrUpdate(Media, assignMediaRecord(peer, f), ['sim_no', 'media_id']);

            let findRequest = Request.findAll({
                        where: {
                            command: 'uploadMedia',
                            sim_no: peer.imei,
                            vehicle_id: peer.vehicle_id,
                            status: 2
                        },
                        limit: 10,
                        order: 'id desc'
                    }).then(rows=> {
                        let firstMatch = null;
                        for (let r of rows) {
                            let data;
                            try {
                                data = JSON.parse(r.data);
                            } catch(e) {
                                data = {mediaId:-1}
                            }

                            if (data.mediaId) {
                                if (data.mediaId === f.mediaId) {
                                    return r;
                                }
                            } else {
                                if (!firstMatch)
                                    firstMatch = r;
                            }
                        }
                        return firstMatch;
                    });

            Promise.all([insertMedia, findRequest]).then(([m, r])=> {

                        if (r != null) {
                            let returned;
                            try {
                                returned = JSON.parse(r.returned);
                            } catch(e) {
                                returned = [];
                            }
                            if (!_.isArray(returned))
                                returned = [];
                            
                            returned.push(m.id);
                            r.update({
                                returned: JSON.stringify(returned)
                            });
                        }
            });
        });
    })
})

}

