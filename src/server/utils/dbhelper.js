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

module.exports = {
  constructQuerySort,
  constructQueryFilter
}
