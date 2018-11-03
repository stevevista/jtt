'use strict'
const Sequelize = require('sequelize')
const Op = Sequelize.Op

function constructQuerySort(option, sortField, sortOrder) {
  if (sortField) {
    const order = [sortField]
    if (sortOrder === 'descend') {
      order.push('DESC')
    }
    option.order = [order]
  }
}

function constructQueryFilter(option, value, field, strict = false) {
  if (!value) {
    return
  }

  if (!option.where) {
    option.where = {}
  }

  if (value instanceof Array) {
    if (strict) {
      option.where[field] = {
        [Op.or]: value.map(n => ({[Op.eq]: n}))
      }
    } else {
      option.where[field] = {
        [Op.or]: value.map(n => ({[Op.like]: `%${n}%`}))
      }
    }
  } else {
    option.where[field] = strict ? value : `%${value}%`
  }
}

function conditionKeywordsReq(ctx, options = {}) {

  if (!options.fields)
    return undefined

  const {sequelize} = ctx.db
  const {ilike, fields} = options
  const type = options.type || 'query'
  const kw = ctx.request[type].kw
  if (kw) {
    let kws = kw.split(',').filter(r => !!r).map(r=> `%${r}%`)
    if (kws.length > 0) {
      const op = ilike ? Op.iLike : Op.like
      return {
        [Op.or]: fields.map(r=> sequelize.where(sequelize.col(r), {[op]: {[Op.any]: kws}}))
      }
    }
  }
}

function conditionlocRangeReq(ctx, options = {}) {

  options = {
    lngCol: 'longitude',
    latCol: 'latitude',
    ...options
  }

  const {sequelize} = ctx.db
  const type = options.type || 'query'
  let llng = +ctx.request[type].llng
  let llat = +ctx.request[type].llat
  let rlng = +ctx.request[type].rlng
  let rlat = +ctx.request[type].rlat

  let lngCol = sequelize.col(options.lngCol)
  let latCol = sequelize.col(options.latCol)

  let conds = {}

  if (!isNaN(llng)) {
      conds.push(sequelize.where(lngCol, {[Op.gte]: llng}))
  }
  if (!isNaN(rlng)) {
      conds.push(sequelize.where(lngCol, {[Op.lte]: rlng}))
  }

  if (!isNaN(llat)) {
      conds.push(sequelize.where(latCol, {[Op.gte]: llat}))
  }
  if (!isNaN(rlat)) {
      conds.push(sequelize.where(latCol, {[Op.lte]: rlat}))
  }

  return conds.length === 0 ? undefined : (conds.length === 1 ? conds[0] : {[Op.and]: conds});
}

//得到补全的开始时间,时分秒清零
function formatBeginDay(strD) {
  if (!strD) {
    return undefined
  }
    
  const d = new Date(strD)
  d.setHours(0)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d.toISOString()
}

//得到补全的结束时间,时分秒补充到23:59:59
function formatEndDay(strD) {
  if (!strD) {
    return undefined
  }
  
  const d = new Date(strD)
  d.setHours(23)
  d.setMinutes(59)
  d.setSeconds(59)
  d.setMilliseconds(0)
  return d.toISOString()
}

function conditionDateRangeReq(ctx, options = {}) {
  let {bt, et} = ctx.request[options.post ? 'body' : 'query']
  if(options.allday) {
    bt = formatBeginDay(bt)
    et = formatEndDay(et)
  }
  const cond = {}
  if (bt) {
     cond[Op.gte] = bt
  }
  if (et) {
    cond[Op.lt] = et
  }
  return cond
}

module.exports = {
  constructQuerySort,
  constructQueryFilter,
  conditionKeywordsReq,
  conditionlocRangeReq,
  conditionDateRangeReq
}
