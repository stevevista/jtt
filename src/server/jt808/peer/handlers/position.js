'use strict'
const logger        = require('log4js').getLogger()
const Peer = require('../peer')

Peer.prototype.onPosition = async function (msg) {

  const {db} = this.app.context
  const {iov_position: Position, iov_alarm: Alarm, iov_device_status: DeviceStatus} = db

  const {vehicleId, plateNo} = this
  const simNo = this.imei

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
    gpsDate: msg.time
  }

  const r = await Position.create({
    ...info,
    vehicleId,
    simNo,
    plateNo,
    valid: !!(msg.status & 0x02)
  })

  const v = await DeviceStatus.findById(simNo)
  if (!v) {
    await DeviceStatus.create({...info, simNo})
  } else {
    if (!(msg.status & 0x02)) {
      delete info.latitude
      delete info.longitude
      delete info.speed
      delete info.direction
      delete info.altitude
    }
    v.update(info)
  }

  // alarms
  const lastAlarms = this.lastAlarms || 0
  let alarms = msg.alarms
  
  if (lastAlarms !== alarms) {
    this.lastAlarms = alarms

    for (let i=0; i<32; i++) {
      let prev = (lastAlarms >> i) & 0x1
      let cur = (alarms >> i) & 0x1

      if (prev !== cur) {
        let off = (cur === 0)
        if (off) {
          const r = await Alarm.findOne({
            where: {child_type: i, status:1, vehicleId},
            order: 'id desc'
          })
          if (r) {
            r.update({
              status: 2,
              end_time: msg.time,
              time_span: Math.floor((msg.time.getTime() - r.start_time.getTime())/1000),
              latitude1: msg.lat,
              longitude1: msg.lng
            })
          }
        } else {
          let regionId = null
          if (msg.overspeedRegionType) {
            regionId = msg.overspeedRegionId
          }
          else if (msg.inOutRegionType) {
            regionId = msg.inOutRegionId
          }
          else if (msg.drivingRouteId) {
            regionId = msg.drivingRouteId
          }

          await Alarm.create({
            msg_sn: msg.SN,
            child_type: i,
            status: 1,
            vehicleId,
            simNo,
            plateNo,
            in_out: msg.inRegion? 1 : (msg.outRegion? 2 : null),
            regionId,
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
            eventId: msg.alarmEvent
          })
        }
      }
    }
  }

  return r
}

Peer.prototype.onBlulkPositions = async function (msgs) {
  const {db} = this.app.context
  const {iov_position: Position} = db

  const {vehicleId, plateNo} = this
  const simNo = this.imei

  const records = msgs.items.map(r=> ({
    vehicleId,
    simNo,
    plateNo,
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
    gpsDate: r.time
  }));

  await Position.bulkCreate(records)
}
