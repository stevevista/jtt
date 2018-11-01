'use strict'
const Peer = require('../peer')

const _ = require('lodash')
const fs = require('fs')

const FORMATS = ['.jpeg', '.tif', '.mp3', '.wav', '.wmv']

function assignMediaRecord(peer, src) {
  let out = {
    simNo: peer.imei,
    vehicleId: peer.vehicleId,
    plateNo: peer.plateNo,
    mediaId: src.mediaId,
            channel: src.channel,
            type: src.type,
            event_code: src.code,
            latitude: src.lat,
            longitude: src.lng,
            status: src.status,
            gpsDate: src.time,
            speed: src.speed,
            direction: src.direction,
            altitude: src.altitude,
            alarm_status: src.alarms
    };

  if (src.format != null) {
    out.format = src.format
  }

  return out
}

async function createOrUpdate(Table, prop, keys) {
  const condition = {}
  keys.forEach(k=> {
    condition[k] = prop[k]
  })

  const r = await Table.findOne({
    where: condition  
  })

  if (!r) {
    return await Table.create(prop)
  }

  return await r.update(prop)
}

Peer.prototype.onMediaEvent = async function (msg) {
  const {db} = this.app.context
  const {iov_media: Media} = db

  const {vehicleId, plateNo} = this
  const simNo = this.imei

  await createOrUpdate(Media, {
    simNo,
    vehicleId,
    plateNo,
    mediaId: msg.mediaId,
    type: msg.type,
    format: msg.format,
    event_code: msg.code,
    channel: msg.channel
  }, ['simNo', 'mediaId'])
}

Peer.prototype.onMedias = async function (msg) {
  const {db} = this.app.context
  const {iov_media: Media} = db

  msg.items.forEach(item => {
    createOrUpdate(Media, assignMediaRecord(this, item), ['simNo', 'mediaId'])
  })
}

Peer.prototype.onMediaFile = async function (f) {

  const {db} = this.app.context
  const {iov_media: Media, iov_request: Request} = db

  const {vehicleId, plateNo} = this
  const simNo = this.imei

  f._filename = `${simNo}_${f.mediaId}_file${FORMATS[f.format]||'.data'}`
  f._io = new Promise((resolve, reject)=> {
    fs.open(`store/${f._filename}`, 'w+', (err, fd) => {
      if (err)reject(err)
      else resolve(fd)
    })
  })

  f.on('data', async d => {
    const fd = await f._io
    f._io = new Promise((resolve, reject)=> {
      fs.write(fd, d, 0, d.length, (err) => {
        if (err)reject(err)
        else resolve(fd)
      })
    })
  })

  f.on('end', async d => {
    const fd = await f._io
    await new Promise((resolve, reject)=> {
      fs.write(fd, d, 0, d.length, (err)=> {
        if (err)reject(err)
        else {
          fs.close(fd, ()=> resolve())
        }
      })
    })

    let insertMedia = createOrUpdate(Media, assignMediaRecord(this, f), ['simNo', 'mediaId'])

    let findRequest = Request.findAll({
      where: {
          command: 'uploadMedia',
          simNo,
          vehicleId,
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
    })

    const [m, r] = await Promise.all([insertMedia, findRequest])
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
      await r.update({
          returned: JSON.stringify(returned)
      })
    }
  })
}
