# Node-JTT API Documents
### Table of Contents


- [events](#events)
  - [Event: 'offline'](#evt-offline)
  - [Event: 'lostHearBeat'](#evt-lost)
  - [Event: 'auth'](#evt-auth)
  - [Event: 'rsa'](#evt-rsa)
  - [Event: 'register'](#evt-register)
  - [Event: 'unregister'](#evt-unregister)
  - [Event: 'params'](#evt-params)
  - [Event: 'properties'](#evt-prop)
  - [Event: 'position'](#evt-pos)
  - [Event: 'posData'](#evt-pos-data)
  - [Event: 'event'](#evt-event)
  - [Event: 'infoDemand'](#evt-info)
  - [Event: 'medias'](#evt-medias)
  - [Event: 'mediaFile'](#evt-media-file)
  - [Event: 'mediaEvent'](#evt-media-event)
  - [Event: 'canData'](#evt-can)
  - [Event: 'custom'](#evt-custom)
- [commands](#commands)
  - [setParams(imei, params[, opt])](#cmd-param)
  - [queryParams(imei[, ids][, opt])](#cmd-param-query)
  - [controlTerminal(imei, prop[, opt])](#cmd-ctl-term)
  - [queryProperties(imei[, prop][, opt])](#cmd-query-prop)
  - [upgradePackage(imei, prop[, opt])](#cmd-upgrade)
  - [queryPosition(imei[, prop][, opt])](#cmd-query-pos)
  - [trackPosition(imei, prop[, opt])](#cmd-track)
  - [confirmAlarms(imei, prop[, opt])](#cmd-confirm)
  - [setText(imei, prop[, opt])](#cmd-text)
  - [setEvents(imei, prop[, opt])](#cmd-events)
  - [question(imei, prop[, opt])](#cmd-ques)
  - [setInfos(imei, prop[, opt])](#cmd-infos)
  - [infoContent(imei, prop[, opt])](#cmd-info-cnt)
  - [callback(imei, prop[, opt])](#cmd-call)
  - [setPhonebook(imei, prop[, opt])](#cmd-phonebook)
  - [controlVehicle(imei, flag[, opt])](#cmd-ctl-veh)
  - [queryMedia(imei, prop[, opt])](#cmd-query-media)
  - [uploadMedia(imei, prop[, opt])](#cmd-upload-media)
  - [requireRSA(imei, rsa[, opt])](#cmd-rsa)

<h2 id="events">**events**</h2>

<h2 id="evt-offline">**Event: 'offline'**</h2>
终端连接断开。
- **info** `{..}`
_______________
<h2 id="evt-lost">**Event: 'lostHearBeat'**</h2>
终端心跳超时。
- **info** `{..}`
- **interval** `int` 超时时间(毫秒)
- **next** `function(close:bool)` 以true调用next，则表示关闭与终端的连接 
_______________
<h2 id="evt-auth">**Event: 'auth'**</h2>
终端主动发出鉴权请求。
- **info** `{..}`
- **token** `string`  鉴权码
- **next** `function(result)`  平台端调用next回应终端鉴权结果，参考协议，result值应在 0~3  
_______________
<h2 id="evt-rsa">**Event: 'rsa'**</h2>
终端主动发出rsa请求，或者终端响应平台的rsa命令。
- **info** `{..}`
- **rsa** `{e:int, n:Buffer}`
- **next** `function(rsa)` | `null`  如果不为null,则表示是终端主动发出的rsa要求，
平台端调用next回应终端，next传入null参数，则会拒接终端，否则应传入 {e,n,d}
_______________
<h2 id="evt-register">**Event: 'register'**</h2>
终端注册请求。
- **info** `{..}`
- **msg** `{e:int, n:Buffer}`
- **next** `function(result, token)`  平台端调用next回应终端注册结果
>msg格式示例:
>```javascript
>{ messageId: 256,
>  _encrypted: false,
>  SN: 0,
>  imei: '123450000000',
>  province: 3322,
>  city: 11,
>  manufactor: 'CCDDA',
>  model: '',
>  termNo: '',
>  color: 2,
>  license: '中文' }
>``` 
_______________
<h2 id="evt-unregister">**Event: 'unregister'**</h2>
终端注销。
- **info** `{..}`
_______________
<h2 id="evt-params">**Event: 'params'**</h2>
终端回复参数查询。
- **info** `{..}`
- **params** `[[paramId, paramVal], ...]`
_______________
<h2 id="evt-prop">**Event: 'properties'**</h2>
终端回复属性查询。
- **info** `{..}`
- **properties** `{..}`
> properties示例:
>```javascript
>{ messageId: 263,
>  _encrypted: false,
>  SN: 0,
>  imei: '123450000000',
>  type: 0,
>  manufactor: 'CCDDA',
>  model: '',
>  termNo: '',
>  iccid: '0000000000',
>  hw: 'LC.2.10.00',
>  fw: '',
>  gnss: 0,
>  comm: 239 }
>```
_______________
<h2 id="evt-pos">**Event: 'position'**</h2>
终端上报位置信息。
- **info** `{..}`
- **msg** `{..}`
- **next** `function(ret)` | `null`  如果不为null,则表示是终端回应平台的位置查询请求,
或者车辆控制应答，ret是返回给平台API调用者，
比如，可能是存储这条位置的数据库记录id
> msg示例:
>```javascript
>{ messageId: 512,
>  _encrypted: false,
>  SN: 0,
>  imei: '123450000000',
>  alarms: 0,
>  status: 2,
>  lat: 121.334,
>  lng: 0,
>  altitude: 1,
>  speed: 2,
>  direction: 3,
>  time: 2011-07-21T07:32:00.000Z,
>  mileage: 999,
>  oil: 888,
>  boardSpeed: 777,
>  alarmEvent: 666,
>  drivingRouteId: 99,
>  drivingTime: -12 }
>```
_______________
<h2 id="evt-pos-data">**Event: 'posData'**</h2>
批量位置信息。
- **info** `{..}`
- **msg** `{..}` 
  - type `int` 0:正常位置批量汇报，1:盲区补报
  - items `[positionObject,...]`
_______________
<h2 id="evt-event">**Event: 'event'**</h2>
终端上报事件。
- **info** `{..}`
- **event** `int` 事件id
_______________
<h2 id="evt-info">**Event: 'infoDemand'**</h2>
信息点播/取消。
- **info** `{..}`
- **prop** `{type:int, cancel:bool}` 
_______________
<h2 id="evt-medias">**Event: 'medias'**</h2>
存储多媒体数据应答。
- **info** `{..}`
- **items** `[..]` 
> item示例:
>```javascript
>{ mediaId: 99,
>       type: 11,
>       channel: 22,
>       code: 33,
>       alarms: 3,
>       status: 2,
>       lat: 121.334,
>       lng: 0,
>       altitude: 1,
>       speed: 2,
>       direction: 3,
>       time: 2011-07-21T07:32:00.000Z }
>```
_______________
<h2 id="evt-media-file">**Event: 'mediaFile'**</h2>
存储多媒体数据上传。
- **info** `{..}`
- **file** `MediaFile` 
> MediaFile对象有两个消息 data（数据）, end (最后一包数据)
> 示例:
>```javascript
>app.on('mediaFile', (info, f)=> {
>  let io = createFile(f);
>  f.on('data', d=> io.write(d));
>  f.on('end', d=> io.writeAndClose(d));
>});
>```
_______________
<h2 id="evt-media-event">**Event: 'mediaEvent'**</h2>
多媒体事件信息。
- **info** `{..}`
- **msg** `{mediaId, type, channel, code, format}` 
_______________
<h2 id="evt-can">**Event: 'canData'**</h2>
CAN 总线数据上传。
- **info** `{..}`
- **msg** `{..}` 
  - milliseconds `int` 接收时间，0时开始经过的毫秒数
  - items `[[canId:int4, canData:buffer(8)],...]`
_______________
<h2 id="evt-custom">**Event: 'custom'**</h2>
未定义的消息上报，可以从msg.messageId获得消息Id, msg._raw获得消息数据。
- **info** `{..}`
- **msg** `{..}`
- **next** `function(result)`  平台端调用next回应终端，result值应在 0~3  
_______________


<h2 id="commands">**commands**</h2>

<h2 id="cmd-param">**setParams(imei, params[, opt])**</h2>
设置终端参数
- **params** `[[paramId, paramVal], ...]` paramVal可能为int,string或buffer
_______________
<h2 id="cmd-param-query">**queryParams(imei[, ids][, opt])**</h2>
查询终端参数，查询结果会以[params](#evt-params)消息上报
- **ids** `[paramId, ...]` | `null` 当ids为空，则查询所有参数
_______________
<h2 id="cmd-ctl-term">**controlTerminal(imei, prop[, opt])**</h2>
控制终端
- **prop** `{..}`
  - cmd `int`  命令字
  - params `[string,...]` | `string;...` 命令参数
_______________
<h2 id="cmd-query-prop">**queryProperties(imei[, prop][, opt])**</h2>
查询终端属性
- **prop** `any` 无用参数，只为保持API接口一致
_______________
<h2 id="cmd-upgrade">**upgradePackage(imei, prop[, opt])**</h2>
下发终端升级包
- **prop** `{..}`
  - type: `int` 升级类型
  - manufactor: `string(5)` 生产商代码
  - version: `string` 版本号
  - length: `int` 包大小
  - data: `buffer` 包数据，不应超过1000字节，超过应设置 opt.packagesCount, opt.packageIndex分包发送
_______________
<h2 id="cmd-query-pos">**queryPosition(imei[, prop][, opt])**</h2>
查询终端位置
- **prop** `any` 无用参数，只为保持API接口一致
_______________
<h2 id="cmd-track">**trackPosition(imei, prop[, opt])**</h2>
临时位置跟踪控制
- **prop** `{..}`
  - interval: `int` 间隔
  - duration: `int` 持续时间
_______________
<h2 id="cmd-confirm">**confirmAlarms(imei, prop[, opt])**</h2>
人工确认报警消息
- **prop** `{..}`
  - ackSN: `int` 原始报警消息流水号
  - type: `int` 报警类型
_______________
<h2 id="cmd-text">**setText(imei, prop[, opt])**</h2>
文本信息下发
- **prop** `{..}`
  - flag: `int` 标志
  - text: `string` 文本
_______________
<h2 id="cmd-events">**setEvents(imei, prop[, opt])**</h2>
事件设置
- **prop** `{..}`
  - type: `int` 事件类型
  - events: `[[eventId, content],...]`
_______________
<h2 id="cmd-ques">**question(imei, prop[, opt])**</h2>
提问
- **prop** `{..}`
  - flag: `int` 问题标志
  - question: `string` 提问题目
  - answers: `[[answerId, content],...]`
_______________
<h2 id="cmd-infos">**setInfos(imei, prop[, opt])**</h2>
信息点播菜单设置
- **prop** `{..}`
  - type: `int` 设置类型 0:删除终端全部信息项; 1:更新菜单; 2:追加菜单; 3:修改菜单
  - infos: `[[infoType, title],...]`
_______________
<h2 id="cmd-info-cnt">**infoContent(imei, prop[, opt])**</h2>
信息服务
- **prop** `{..}`
  - type: `int` 信息类型
  - content: `string` 信息内容
_______________
<h2 id="cmd-call">**callback(imei, prop[, opt])**</h2>
电话回拨
- **prop** `{..}`
  - monitor: `bool` 是否监听
  - phone: `string` 电话号码
_______________
<h2 id="cmd-phonebook">**setPhonebook(imei, prop[, opt])**</h2>
设置电话本
- **prop** `{..}`
  - type: `int` 0:删除终端上所有存储的联系人; 1:表示更新电话本(删除终端中已有全部联系人 并追加消息中的联系人); 2:表示追加电话本; 3:表示修改电话本(以联系人为索引)
  - items: `[[flag, phnoe, name],...]` 
_______________
<h2 id="cmd-ctl-veh">**controlVehicle(imei, flag[, opt])**</h2>
车辆控制
- **flag** `int` 控制指令标志
_______________
<h2 id="cmd-query-media">**queryMedia(imei, prop[, opt])**</h2>
存储多媒体数据检索，检索结果以medias消息上报
- **prop** `{..}`
  - type `int`
  - channel `int`
  - code `int`
  - start `date`
  - end `date`
_______________
<h2 id="cmd-upload-media">**uploadMedia(imei, prop[, opt])**</h2>
存储多媒体数据上传
- **prop** `{..}`
  - mediaId `int` 指定媒体Id
  - type `int`
  - channel `int`
  - code `int`
  - start `date`
  - end `date`
  - del `bool`
_______________
<h2 id="cmd-rsa">**requireRSA(imei, rsa[, opt])**</h2>
要求与终端RSA加密通讯
- **rsa** `{e:int, n:Buffer, d:Buffer}`
_______________



35
  设置圆形区域
0x8600
36
删除圆形区域
0x8601
37
设置矩形区域
0x8602
38
  删除矩形区域
0x8603
39
设置多边形区域
0x8604
40
删除多边形区域
0x8605
41
设置路线
0x8606
42
删除路线
0x8607
43
行驶记录仪数据采集命令
0x8700
44
行驶记录仪数据上传
0x0700
45
行驶记录仪参数下传命令
0x8701
46
电子运单上报
0x0701
47
驾驶员身份信息采集上报
0x0702
48
上报驾驶员身份信息请求
0x8702
59
  录音开始命令
0x8804
61
数据下行透传
0x8900
62
数据上行透传
0x0900
63
  数据压缩上报
0x0901
54
摄像头立即拍摄命令
0x8801
55
摄像头立即拍摄命令应答
0x0805
