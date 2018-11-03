'use strict'
const config = require('../config')
const logger = require('log4js').getLogger()
const CURRENT_VER = 1

async function modelVersion(db) {
  try {
    const [res] = await db.sequelize.query('SELECT version FROM __model_version__')
    if (res.length) {
      return res[res.length - 1].version
    }
  } catch (e) {
    logger.info('no __model_version__')
  }

  try {
    const qi = db.sequelize.getQueryInterface()
    await qi.describeTable('users')
    return 0
  } catch (e) {
    return -1
  }
}

async function migrate(db) {
  const ver = await modelVersion(db)
  logger.info(`model version = ${ver}`)
  if (ver >= CURRENT_VER) {
    return
  }

  let syncCb
  if (ver >= 0) {
    // backup old table
    const qi = db.sequelize.getQueryInterface()
    qi.renameTable('users', 'users_old')

    syncCb = async () => {
      qi.dropTable('users_old')
    }
  }

  await initializeDb(db, syncCb)
}

const menuData = [{
  name: '资料维护',icon: 'archive',
  sub: [{
          name: '信息维护',url: '/iov/materialmanager/infomgr/groupmgr/index.html', icon: 'envelope-o'
      },{
          name: '车辆停用',url: '',icon: 'hand-stop-o'
      },{
          name: '地图标注',url: '',icon: 'map'
      },{
          name: '维修保养',url: '',icon: 'legal'
      },{
          name: '区域维护',url: 'iov/materialmanager/areamanager/index.html',icon: 'cube'
      },{
          name: '规则管理',url: '',icon: 'sitemap'
      },{
          name: '视频设备',url: '',icon: 'camera'
      },{
          name: '信号设置',url: '',icon: 'signal'
      },{
          name: '司机管理',url: '/iov/materialmanager/drivermanager/index.html',icon: 'car'
      },{
          name: '地理位置',url: '',icon: 'area-chart'
      },{
          name: '数据字典',url: '',icon: 'database'
      }]
  },{
  name: '监控管理', icon: 'video-camera',
  sub: [{
          name: '车辆监控',url: '/iov/moniter/realtime/index.html',icon: 'automobile'
      },{
          name: '整体监控',url: '/iov/moniter/realtime/index.html',icon: 'eye'
      },{
          name: '照片查看',url: '',icon: 'file-photo-o'
      },{
          name: '多媒体查询',url: '',xurl: '/iov/pages/multimedia/index.html',icon: 'image'
      },{
          name: '查岗报文',url: '',icon: 'search'
      },{
          name: '未分组监控',url: '',icon: 'search-plus'
      },{
          name: '信息报表',url: '/iov/moniter/report/index.html',icon: 'list-alt'
      },{
          name: '报警监控',url: '',icon: 'fire'
      },{
          name: '运行分析',url: '',icon: 'flag'
      },{
          name: '聚合监控',url: '',icon: 'flash'
      },{
          name: '故障分析',url: '',icon: 'warning'
      },{
          name: '区域设置',url: 'iov/moniter/areasettings/index.html',icon: 'adjust'
      },{
          name: '参数查看',url: '/iov/moniter/parameters/index.html',icon: 'eye-slash'
      }]
  },{
  name: '系统管理',icon: 'server',
  sub: [{
          name: '用户管理',url: '/iov/systemmanager/usermanager/index.html',icon: 'user'
      },{
          name: '终端类用户管理',url: '/iov/systemmanager/registermanager/index.html',icon: 'user-o'
      },{
          name: '系统监控',url: '',icon: 'wrench'
      },{
          name: '设备安装',url: '',icon: 'glass'
      },{
          name: '公司注册',url: '',icon: 'gg'
      },{
          name: '客户定制',url: '',icon: 'connectdevelop'
      },{
          name: '操作日志',url: '',icon: 'paw'
      },{
          name: '角色管理',url: '',icon: 'user-o'
      },{
          name: '密码修改',url: '',icon: 'compass'
      }]
  },{
  name: 'LED调度',icon: 'lightbulb-o',
  sub: [{
          name: 'LED管理',url: '',icon: 'moon-o'
      },{
          name: '客户管理',url: '',icon: 'user-circle'
      },{
          name: '广告管理',url: '',icon: 'refress'
      },{
          name: '广告投放',url: '',icon: 'reply'
      }]
  },{
  name: '费用管理',icon: 'btc',
  sub: [{
          name: '费用维护',url: '',icon: 'euro'
      }]
  },{
  name: 'APP管理',icon: 'apple',
  sub: [{
          name: 'APP配置',url: '',icon: 'book'
      },{
          name: 'APP费用',url: '',icon: 'rmb'
      }]
  }
];

const instructionData = [{
      name: '指令发送',
      sub: [ {
              name: '参数设置', url: '/iov/pages/set/information_service.html', cmdId: 33793
          }, {
              name: '通讯参数', url: '/iov/pages/set/communication_parameter.html', cmdId: 33027
          }, {
              name: '电话回拨', url: '/iov/pages/set/phone_callback.html', cmdId: 33792
          }, {
              name: '临时位置跟踪控制', url: '/iov/pages/set/temporary_location_tracking.html', cmdId: 33282
          }, {
              name: '文本信息下发', url: '/iov/pages/set/text_info.html', cmdId: 33536
          }, {
              name: '提问下发', url: '/iov/pages/set/question_issued.html', cmdId: 33538
          }, {
              name: '信息服务', url: '/iov/pages/set/information_service.html', cmdId: 33540
          }, {
              name: '设置电话本', url: '/iov/pages/set/phonebook_set.html', cmdId: 33793
          }, {
              name: '车辆控制', url: '/iov/pages/set/car_control.html', cmdId: 34048
          }, {
              name: '录音', url: '/iov/pages/set/record.html', cmdId: 34820
          }, {
              name: '拍照', url: '/iov/pages/set/camera.html', cmdId: 34817
          }, {
              name: '事件设置', url: '/iov/pages/set/event.html', cmdId: 33537
          }, {
              name: '信息点播菜单设置', url: '/iov/pages/set/info_ondemand.html', cmdId: 33539
          }]
  }
];

function toRecords(treeList, array = [], parents = '') {
  treeList.forEach(t => {
    let id = array.length + 1
    array.push({id, parents, ...t})
    if (t.sub) {
      let subparents = parents ? (parents + id + '.') : ('.' + id + '.')
      toRecords(t.sub, array, subparents)
    }
  })
  return array
}

async function initializeDb(db, syncCb) {
  await db.sequelize.sync({logging: (log) => logger.info(log), force: false, alter: false})
  if (typeof syncCb === 'function') {
    await syncCb()
  }

  const {
    group: Group,
    user: User,
    menu: Menu,
    instruction: Instruction,
    usermenu: UserMenu,
    regcode: RegCode
  } = db

  const reginCodes = require('./GBRegionCodes')

  let userCreate = false
  await db.sequelize.transaction(async transaction => {
    console.log('创建固定组-终端 .....')
    if (await Group.count() === 0) {
      await Group.create({
        name: '终端',
        owner: config.sysadmin.username,
        parents: ''
      }, {transaction})
    }
    
    console.log('创建系统用户 .....')
    if (await User.count() === 0) {
      await User.createEx({
        ...config.sysadmin,
        auth_level: 0
      }, {transaction})
      userCreate = true
    }

    console.log('初始化系统菜单 .....')
    if (await Menu.count() === 0) {
      await Menu.bulkCreate(toRecords(menuData), {transaction})
    }

    console.log('初始化指令 .....')
    if (await Instruction.count() === 0) {
      await Instruction.bulkCreate(toRecords(instructionData), {transaction})
    }

    console.log('usermenu')
    if (userCreate) {
      await UserMenu.bulkCreate([
        {user_id: 1, menu_id: 14, sort_order:1},
        {user_id: 1, menu_id: 20, sort_order:2},
        {user_id: 1, menu_id: 28, sort_order:3},
        {user_id: 1, menu_id: 10, sort_order:4},
        {user_id: 1, menu_id:  2, sort_order:5},
        {user_id: 1, menu_id:  6, sort_order:6},
        {user_id: 1, menu_id: 25, sort_order:7},
        {user_id: 1, menu_id: 26, sort_order:8}], {transaction})
    }

    console.log('初始化区域代码 .....')
    if (await RegCode.count() === 0) {
      await RegCode.bulkCreate(reginCodes, {transaction})
    }
  })

  await db.__model_version__.create({version: CURRENT_VER})
  
  logger.info('db initialized!')
}

module.exports = migrate
