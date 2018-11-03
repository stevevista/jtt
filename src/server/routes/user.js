'use strict'
const Router = require('koa-router')
const Sequelize = require('sequelize')
const compose = require('koa-compose')
const {validate} = require('../utils/validate')
const Joi = require('joi')
const {authenticateRequird, authLevel, isSuper, higherLevelThan, login, isAuthedParam} = require('../auth')

const Op = Sequelize.Op

const router = new Router()

function authListPararms(where) {
  return compose([
    isAuthedParam( { where, field: 'menus', type: 'menu' }),
    isAuthedParam( { where, field: 'groups', type: 'group' }),
    isAuthedParam( { where, field: 'instructions', type: 'instruction' }),
    async (ctx, next) => {
      const auths = {}
      ['group', 'menu', 'instruction'].forEach( k => {
          if ( ctx.state[k] ) auths[k] = ctx.state[k]
      })

      ctx.state.auths = auths
      await next()
    }
  ])
}

function conditionAuthedToQueryUsers( user ) {
  if ( user.isSuperMaster() ) {
      return {}
  }
  return { creator: user.username }
}

function findUser( options = {} ) {

  options = {excludeSelf: false, ...options}

  return async function (ctx, next) {

    const id = +ctx.params.userid
    if (isNaN(id)) {
      ctx.state.foundUser = ctx.state.user
      await next()
      return
    }

    if ( id === ctx.state.user.id ) {
      ctx.assert(!options.excludeSelf, 400)
      ctx.state.foundUser = ctx.state.user
      await next()
      return
    }

    const {user: User} = ctx.db
    const user = await User.findOne({
      where: { id, ...conditionAuthedToQueryUsers(ctx.state.user)  }
    })
    ctx.assert(user, 400, 'User not exists')

    ctx.state.foundUser = user
    await next() 
  }
}

async function userMenus(Menu, user) {
  const obj = await Menu.asTree( user.auths.menu, {
      createNode: ( r ) => {
          let n = {
              text: r.name,
              href: r.url,
              id: r.id + '',
              size: 'full',
              icon: r.icon,
          };
          return n;
      }
  })

  const rows = await user.getUsermenus()
  rows.forEach( r => {
    let node = obj.map[r.menu_id];
    if ( node ) {
      node.shortcut = true;
      node.sort_order = r.sort_order;
    }
  })
  
  return obj.roots
}

async function userAuthRouter(ctx) {
  const {subcmd} = ctx.params

  const {menu: Menu} = ctx.db
  const user = ctx.state.foundUser

  if (!subcmd) {
    ctx.body = user.toSimpleObject()
    return
  }

  if (subcmd === 'menus' || subcmd === 'auth') {
    const obj = await user.getFormatted()
    if (subcmd === 'menus') {
      obj.menus = await userMenus(Menu, user)
    }
  
    ctx.body = obj
    return
  }

  const type = subcmd.substr(5)
  ctx.body = await user.getFormatted2( ctx.db, type )
}

/**
 * /            只返回基本信息
 * /auth        包含权限地图
 * /auth/all    包含所有权限树
 */
router.post('/login/:subcmd(menus|auth|auth/all|auth/terminal|auth/group|auth/menu|auth/instruction)?', 
  login(),
  async (ctx, next) => { 
    ctx.state.foundUser = ctx.state.user
    await next()
  },
  userAuthRouter)

router.post('/logout', ctx => {
  ctx.cookies.set('access_token', undefined)
  ctx.body = {}
})

router.use(authenticateRequird())

router.get('/:userid(\\d+)?/:subcmd(menus|auth|auth/all|auth/terminal|auth/group|auth/menu|auth/instruction)?',
  findUser(),
  userAuthRouter)

router.get('/search', async ctx => {
  const params = validate(ctx.request.query, {
    username: Joi.string().required()
  })

  const username = params.username.replace( '*', '%' )

  const {user: User} = ctx.db
  const users = await User.findAll( {
    where: { username: { [Op.like]: username }, ...conditionAuthedToQueryUsers( ctx.state.user ) }
  })
  let tasks = users.map( u => u.getFormatted() )
  ctx.body = await Promise.all(tasks)
})

/**
 * 修改密码
 * 必须先登录
 */
router.post( '/:userid(\\d+)?/password',
  findUser(),
  async ctx => {

    const user = ctx.state.foundUser

    const params = validate(ctx.request.body, {
      password: Joi.string().default(''),
      newpassword: Joi.string().required()
    })

    if ( user === ctx.state.user ) {
      ctx.assert(await ctx.state.user.checkPassword(params.password), 401, 'wrong password')
    }

    user.password = await ctx.db.user.hashPassword(params.newpassword)
    await user.save()
    ctx.body = { success: true }
  })

/**
 * 当前用户或其他用户添加快捷菜单
 * /shortcut    当前用户添加快捷菜单
 * /2/shortcut  其他用户添加快捷菜单
 */
router.post( '/:userid(\\d+)?/shortcut',
  isAuthedParam( { where: 'body', field: 'menus', type: 'menu', order: 'keep' }),
  findUser(),
  async ctx => {

    let sortid = 1
    let user_id = ctx.state.foundUser.id

    //auth.isAuthedArrayParam get array by where and field
    // add type(menu) to req.params
    const crows = ctx.state.menu.map(u => ({
      user_id,
      menu_id: u.id,
      sort_order: sortid++
    }))

    if (crows.length === 0) {
      ctx.body = []
      return
    }

    await ctx.db.usermenu.destroy({ where: {user_id} })
    const results = await ctx.db.usermenu.bulkCreate(crows)
    ctx.body = results.map(r => ({mid: r.menu_id}))
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

module.exports = router
