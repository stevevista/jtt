'use strict'
const jwt = require('jsonwebtoken')
const compose = require('koa-compose')
const config = require('./config')
const {validate} = require('./utils/validate')
const Joi = require('joi')

function authenticateRequird (required = true) {
  return async function (ctx, next) {
    const token = (ctx.query && ctx.query.access_token) || 
      (ctx.request.body && ctx.request.body.access_token) || 
      ctx.headers['x-access-token'] ||
      (ctx.cookies.get('access_token'))

    if (!token) {
      if (required) {
        ctx.throw(401, 'No authorization token was found')
      }
      await next()
      return
    }
    ctx.state._token = token
    const {id} = await decodeToken(token)

    const {user: User} = ctx.db
    const user = await User.findOne({ where: { id, ...User.validStatus } })
    ctx.assert(user, 401)
    await user.getAuths()
    ctx.state.user = user
    await next()
  }
}

function login(options = {}) {
  return async function (ctx, next) {
    const {user: User} = ctx.db

    const params = validate(ctx.request.body, {
      username: Joi.string().required(),
      password: Joi.string().required(),
      ltype: Joi.string(),
      version: Joi.string()
    })

    const {username} = params

    const user = await User.findOne({
      where: { username, ...User.validStatus }
    })

    const authed = user && await user.checkPassword(params.password)
    ctx.assert(authed, 403, 'wrong user or password')

    const token = await signToken({
      id: user.id,
      username,
      level: user.auth_level
    })
    
    user.login_type = params.ltype
    user.version = params.version
    user.ip = ctx.ip
    user.login_date = new Date()

    ctx.cookies.set('access_token', token, { maxAge: config.session.maxAge })
    ctx.state.user = user
    ctx.state._token = token
    await next()
  }
}

function decodeToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.session.secrets, (err, decoded) => {
      if (err) reject(err)
      else resolve(decoded)
    })
  })
}

function signToken (obj, opt = {}) {
  const expiresIn = opt.maxAge || (config.session.maxAge / 1000)
  return new Promise((resolve, reject) => {
    jwt.sign(obj, config.session.secrets, {expiresIn}, (err, token) => {
      if (err) reject(err)
      else resolve(token)
    })
  })
}

const levels = {
  'super': 0,
  'admin': 1,
  'reporter': 2,
  'customer': 3,
  'visitor': 4
}

function mapLevel(s) {
  if (!(s in levels)) throw new Error(`unknown level ${s}`)
  return levels[s]
}

function _authLevel(level) {
  if (typeof level === 'string') {
    level = mapLevel(level)
  }
  return async function (ctx, next) {
    if (typeof ctx.state.decoded_token.level !== 'number' || ctx.state.decoded_token.level > level) {
      ctx.throw(401, `auth level need above ${level}`)
    }
    await next()
  }
}

function authLevel(level) {
  return compose([
    authenticateRequird(),
    _authLevel(level)
  ])
}

function isSuper(ctx) {
  return ctx.state.decoded_token && ctx.state.decoded_token.level === 0
}

function higherLevelThan(ctx, level) {
  return typeof ctx.state.decoded_token.level === 'number' && ctx.state.decoded_token.level < level
}

/**
 * 过滤权限
 */
function isAuthedParam(options = {}) {
  options = {
    where: 'query',
    ...options
  }
  
  const {field, type} = options

  if (!type || !field) {
      throw new Error('auth type or param field not found')
  }
  const table = type

  return async function(ctx, next) {

    let authid = ctx.request[options.where][field] || ''
    authid = authid.split(',').map(r=> +r).filter(r=> !isNaN(r))

    if (authid.length === 0) {
      await next()
      return
    }

    let paths = await ctx.db[table].getPaths(authid, (options.order === 'keep'))
    paths = paths.filter(id => id.isChildOfOrEqual(ctx.state.user.auths[type]))
    if (authid.length !== paths.length) {
      ctx.throw(403)
    }

    ctx.state[type] = paths
    await next()
  }
}

module.exports = {
  authenticateRequird,
  signToken,
  decodeToken,
  authLevel,
  isSuper,
  mapLevel,
  higherLevelThan,
  login,
  isAuthedParam
}
