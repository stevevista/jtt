'use strict'
const Router = require('koa-router')
const Sequelize = require('sequelize')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const {authenticateRequird, authLevel, signToken, isSuper, higherLevelThan} = require('../auth')

const Op = Sequelize.Op

const router = new Router()

router.get('/auth', authenticateRequird(), async ctx => {
  ctx.body = ctx.state.decoded_token
})

router.post('/auth', async ctx => {
  const params = validate(ctx.request.body, {
    username: Joi.string().required(),
    password: Joi.string().required()
  })

  const dbuser = await ctx.db.users.findOne({
    where: {
      username: params.username
    }
  })

  const authed = dbuser && await dbuser.checkPassword(params.password)
  ctx.assert(authed, 401, 'wrong user or password')

  const tok = {
    id: dbuser.id,
    username: dbuser.username,
    level: dbuser.level
  }
  signToken(tok, ctx)

  ctx.body = tok
})

router.post('/logout', ctx => {
  ctx.cookies.set('access_token', undefined)
  ctx.body = ''
})

router.post('/password', authenticateRequird(), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string().required(),
    old_password: Joi.string().required()
  })

  const dbuser = await ctx.db.users.findOne({
    where: {
      username: ctx.state.decoded_token.username
    }
  })
  ctx.assert(dbuser, 400, `${ctx.state.decoded_token.username} not exists!`)

  const ret = await dbuser.checkPassword(params.old_password)
  ctx.assert(ret, 401, 'wrong password')

  await ctx.db.users.updateEx({
    password: params.password
  }, {
    where: {
      username: ctx.state.decoded_token.username
    }
  })
  ctx.body = ''
})

router.post('/:username/add', authLevel('admin'), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string().required(),
    level: Joi.number().integer().required()
  })

  ctx.assert(ctx.state.decoded_token.username, 401, 'bad user')
  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  try {
    await ctx.db.users.createEx({
      username: ctx.params.username,
      password: params.password,
      level: params.level,
      creator: ctx.state.decoded_token.username
    })
  } catch (e) {
    if (e instanceof Sequelize.UniqueConstraintError) {
      ctx.throw('username already exists')
    }
    throw e
  }

  ctx.body = ''
})

function queryAdminableUser(ctx, option, username) {
  option.where = {
    username
  }

  if (!isSuper(ctx)) {
    option.where.creator = ctx.state.decoded_token.username
  }
}

router.post('/:username/update', authLevel('admin'), async ctx => {
  const params = validate(ctx.request.body, {
    password: Joi.string(),
    level: Joi.number().integer().required()
  })

  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  const fields = {
    level: params.level
  }
  if (params.password) {
    fields.password = params.password
  }

  const option = {}

  queryAdminableUser(ctx, option, ctx.params.username)
  await ctx.db.users.updateEx(fields, option)

  ctx.body = ''
})

router.post('/:username/del', authLevel('admin'), async ctx => {

  const option = {}

  queryAdminableUser(ctx, option, ctx.params.username)
  await ctx.db.users.destroy(option)

  ctx.body = ''
})

router.get('/list', authLevel('admin'), async ctx => {
  const option = {}

  if (!isSuper(ctx)) {
    option.where = {
      creator: ctx.state.decoded_token.username,
      level: {[Op.gt]: ctx.state.decoded_token.level}
    }
  } else {
    option.where = {
      username: {[Op.ne]: ctx.state.decoded_token.username}
    }
  }

  const users = await ctx.db.users.findAll(option)
  users.forEach(u => { u.password = undefined })
  ctx.body = users
})

router.post('/share-token', authenticateRequird(), async ctx => {
  const params = validate(ctx.request.body, {
    level: Joi.number().integer().required(),
    max_age: Joi.number().integer().max(60 * 60 * 24 * 7).default(60 * 60)
  })

  ctx.assert(higherLevelThan(ctx, params.level), 401, 'bad auth level')

  const tok = {
    level: params.level,
    owner: ctx.state.decoded_token.username
  }
  const signed = signToken(tok, null, {maxAge: params.max_age})

  ctx.body = signed
})

module.exports = router
