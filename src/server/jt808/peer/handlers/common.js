'use strict'

const Peer = require('../peer')
const logger = require('log4js').getLogger()

Peer.prototype.onOffline = function () {
  const {db} = this.app.context
  const {iov_device_status: DeviceStatus} = db
  const simNo = this.imei
  if (simNo) {
    DeviceStatus.update({online: false}, { where: {simNo} })
  }
}

Peer.prototype.onAuth = async function (token) {
  const {db} = this.app.context
  const {iov_device: Device, iov_vehicle: Vehicle, iov_device_status: DeviceStatus} = db

  const simNo = this.imei

  const r = await Device.findOne({
    include: [{model: Vehicle}],
    where: {simNo}
  })

  if (!r) {
    logger.error(`[${simNo}] not exists`)
    return 1
  }

  if (!r.iov_vehicle) {
    logger.error(`[${simNo}] not installed on any vehicle`);
    return 1
  }

  this.vehicleId = r.vehicleId
  this.plateNo = r.iov_vehicle.plateNo

  await DeviceStatus.update({online: true}, {where: {simNo}})
  logger.info(`[${simNo}] on ${this.plateNo} authed`)
  return 0
}

Peer.prototype.onRegister = async function (msg) {
  const {db} = this.app.context
  const {iov_device: Device, iov_vehicle: Vehicle, iov_device_status: DeviceStatus} = db

  const simNo = this.imei

  const r = await Device.findOne({
    include: [{model: Vehicle}],
    where: {simNo}
  })

  if (!r) {
    return [4]
  }

  if (r.iov_vehicle) {
    if (r.iov_vehicle.plateNo === msg.license) {
      this.vehicleId = r.vehicleId
      this.plateNo = r.iov_vehicle.plateNo
      await DeviceStatus.update({online: true}, {where: {simNo}})
      return [0, 'leadcore']
    } else
      return [3]
  }

  const v = await Vehicle.findOne({
    include: [{model: Device}],
    where: {plateNo: msg.license}
  })

  if (!v) {
    return [2]
  }

  if (v.iov_device) {
      return [1]
  }

  await r.setIov_vehicle(v)
  
  this.vehicleId = v.id
  this.plateNo = v.plateNo
  await DeviceStatus.update({online: true}, {where: {simNo}})
  return [0, 'leadcore']
}

Peer.prototype.onUnregister = async function () {
  const {db} = this.app.context
  const {iov_device: Device} = db

  const simNo = this.imei

  Device.update({
    vehicleId: null 
  }, {
    where: {simNo}
  })
}
