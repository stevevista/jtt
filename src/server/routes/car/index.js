'use strict'
const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const {authenticateRequird, isAuthedParam} = require('../../auth')
const {conditionKeywordsReq, conditionlocRangeReq, conditionDateRangeReq} = require('../../utils/dbhelper')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const router = new Router()

router.use(authenticateRequird())

router.get('/search/tree',
  isAuthedParam({where: 'query', field:'group', type: 'group'}),
  async ctx => {
    let kw = conditionKeywordsReq(ctx, {fields:['terminal.sim_no', 'terminal.plate_no', 'terminal.model']})
    let loc = conditionlocRangeReq(ctx, {lngCol: 'terminal.realtime.longitude', latCol: 'terminal.realtime.latitude'})

    let authGroups = ctx.state.group || ctx.state.user.auths.group

    const {
      sequelize,
      terminal: Terminal,
      realtime: RealTime,
      group: Group} = ctx.db

    const prop = {
      include: [{
        model: Terminal,
        include: [{
          model: RealTime
        }],
      }],
      where: {[Op.and]: []},
      order: [['is_terminal']]
    }

    let nullable = sequelize.where(sequelize.col('terminal'), null)
    if (kw) {
        prop.where[Op.and].push({[Op.or]: [nullable, kw]})
    }

    if (loc) {
        prop.where[Op.and].push({[Op.or]: [nullable, loc]})
    }

    prop.createNode = function(r, parent) {
        let n = r.asNode();
        n.authed = ctx.state.user.hasAuth('group', r.treeId());
        if (r.terminal) {
            n.name = r.terminal.plate_no;
            n = _.extend(n, r.terminal.toJsonFull());
            if (parent){
                //补上group信息,与toJsonFull中同步
                n.orgname = parent.name;
                n.orggroup = parent.id;
            }
        }
        return n;
    }

    const out = await Group.asTree(authGroups, prop)
    ctx.body = out.roots
  })

/**
 * 车辆报警查询
 */
router.get('/:terminalid?/alarms', async ctx => {

  const kw = conditionKeywordsReq(ctx, {fields:['terminal.sim_no', 'terminal.plate_no', 'terminal.model']})
  const loc = conditionlocRangeReq(ctx)
  const daterange = query.conditionDateRangeReq(req)
})
module.exports = router
