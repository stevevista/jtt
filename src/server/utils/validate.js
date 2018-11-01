const Joi = require('joi')

function validate(obj, schema) {
  const {error, value} = Joi.validate(obj, schema, {allowUnknown: true, convert: true})
  if (error) {
    error.status = 400
    throw error
  }
  return value
}

module.exports = {
  validate
}
