'use strict'
const Router = require('koa-router')
const fs = require('fs')
const path = require('path')

const router = new Router()

router.get('/', ctx => {
  ctx.redirect('/index.html')
})

const files = fs.readdirSync(__dirname)

for (const f of files) {
  if (f === 'index.js') {
    continue
  }

  const name = f.replace(/(\.\/|\.js)/g, '')
  const subrouter = require(path.join(__dirname, f))
  router.use('/' + name, subrouter.routes(), subrouter.allowedMethods())
}

module.exports = router
