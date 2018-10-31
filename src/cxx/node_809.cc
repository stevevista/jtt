#include "node_808.h"
#include "utils.h"
#include <time.h>

#define SHORTEN(x, p)                             \
do {                                              \
    x = (p).size;                                 \
    for (; x>0 && (p).data[x-1]==0; x--);         \
}while(0)

Local<Value> decodeGBK(const char* in, uint32_t inszie);
Local<Value> decodeOct7Date(const uint8_t* in);

template<class T>
Local<Value> decodeGBK(const T& t) {
    Nan::EscapableHandleScope scope;

    uint8_t ssize;
    SHORTEN(ssize, t);
    return scope.Escape(decodeGBK(t.data, ssize));
}




template<class T>
Local<Value> decodeStr(const T& t) {
    Nan::EscapableHandleScope scope;

    uint8_t ssize;
    SHORTEN(ssize, t);
    return scope.Escape(Nan::New(t.data, ssize).ToLocalChecked());
}

Local<Value> decodeStr(const char* s, uint32_t ssize) {
    Nan::EscapableHandleScope scope;

    for (; ssize>0 && s[ssize-1]==0; ssize--); 
    return scope.Escape(Nan::New(s, ssize).ToLocalChecked());
}

Local<Value> decodeGbk(const char* s, uint32_t ssize) {
    Nan::EscapableHandleScope scope;

    for (; ssize>0 && s[ssize-1]==0; ssize--); 
    return scope.Escape(decodeGBK(s, ssize));
}


void packageGnss(Local<Object>& msg, const GNSS& gnss) {
    Nan::HandleScope scope; 
    Nan::Set(msg, Nan::New("encrypt").ToLocalChecked(), Nan::New(gnss.encrypt));
    Nan::Set(msg, Nan::New("time").ToLocalChecked(), decodeOct7Date((const uint8_t*)gnss.datetime));
    Nan::Set(msg, Nan::New("lat").ToLocalChecked(), Nan::New(((double)Swap32(gnss.lat))/1000000));
    Nan::Set(msg, Nan::New("lng").ToLocalChecked(), Nan::New(((double)Swap32(gnss.lng))/1000000));
    Nan::Set(msg, Nan::New("speed").ToLocalChecked(), Nan::New(Swap16(gnss.speed)));
    Nan::Set(msg, Nan::New("boardSpeed").ToLocalChecked(), Nan::New(Swap16(gnss.bspeed)));
    Nan::Set(msg, Nan::New("mileage").ToLocalChecked(), Nan::New(Swap32(gnss.mileage)));
    Nan::Set(msg, Nan::New("direction").ToLocalChecked(), Nan::New(Swap16(gnss.direction)));
    Nan::Set(msg, Nan::New("altitude").ToLocalChecked(), Nan::New(Swap16(gnss.altitude)));
    Nan::Set(msg, Nan::New("status").ToLocalChecked(), Nan::New(Swap32(gnss.status)));
    Nan::Set(msg, Nan::New("alarms").ToLocalChecked(), Nan::New(Swap32(gnss.alarms)));
}

#define STR(x) decodeStr(x, sizeof(x))
#define GBK(x) decodeGbk(x, sizeof(x))

#define BYTESTR(x)  Nan::New(x, sizeof(x)).ToLocalChecked()


#define ISSPACE(x) \
    ((x) == ' ' || (x) == '\t' || (x) == '\r' || (x) == '\n')

 #define ISALPHA(x) \
    (((x)>= 'A' && (x)<='Z') || ((x)>= 'a' && (x)<='z')  )  

 #define ISNUM(x) \
    ((x)>= '0' && (x)<='9')





#define Swap64(ll) (((ll) >> 56) | \
                    (((ll) & 0x00ff000000000000) >> 40) | \
                    (((ll) & 0x0000ff0000000000) >> 24) | \
                    (((ll) & 0x000000ff00000000) >> 8)    | \
                    (((ll) & 0x00000000ff000000) << 8)    | \
                    (((ll) & 0x0000000000ff0000) << 24) | \
                    (((ll) & 0x000000000000ff00) << 40) | \
                    (((ll) << 56)))  

#define Swap(x) \
    ( sizeof(x) == 4 ? Swap32(x) : ( sizeof(x) == 2 ? Swap16(x) :(x) ) )




uint32_t bundlePackage(Local<Object>& msg, 
                    uint16_t msg_id,
                    const pkg_content1* info, 
                    const char* data,
                    uint32_t data_size) {

    Nan::HandleScope scope; 

    const uint16_t mask = msg_id & 0x0f00;

    if (mask == 0x0200 || mask == 0x0400 || mask == 0x0500 || mask == 0x0600) {
        Nan::Set(msg, Nan::New("plateNo").ToLocalChecked(), GBK(info->base.vehicleNo));
        Nan::Set(msg, Nan::New("color").ToLocalChecked(), Nan::New(info->base.color));
        Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(Swap16(info->base.dataType)));
    } else if (mask == 0x0300) {
        Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(Swap16(info->datainfo.dataType)));
    }


        

    switch (msg_id) {
        case 0x1001:
            Nan::Set(msg, Nan::New("userId").ToLocalChecked(), Nan::New(Swap(info->connectReq.userId)));
            Nan::Set(msg, Nan::New("password").ToLocalChecked(), STR(info->connectReq.password));
            Nan::Set(msg, Nan::New("ip").ToLocalChecked(), STR(info->connectReq.ip));
            Nan::Set(msg, Nan::New("port").ToLocalChecked(), Nan::New(Swap(info->connectReq.port)));
            break;

        case 0x1002:
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(Swap(info->up_connect_rsp.result)));
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(Swap(info->up_connect_rsp.verifyCode)));
            break;

        case 0x1003:
            Nan::Set(msg, Nan::New("userId").ToLocalChecked(), Nan::New(Swap(info->up_disconnect_req.userId)));
            Nan::Set(msg, Nan::New("password").ToLocalChecked(), STR(info->up_disconnect_req.password));
            break;

        case 0x1007:
        case 0x1008:
        case 0x9007:
        case 0x9008:
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(info->byte_val));
            break;

        case 0x9001:
        case 0x9003:
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(Swap32(info->dword_val)));
            break;

        case 0x9002:
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(info->byte_val));
            break;

        case 0x9101: {
            Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(Swap32(info->down_total_recv_back_msg.total)));
            Nan::Set(msg, Nan::New("start").ToLocalChecked(), Nan::New<Date>(Swap64(info->down_total_recv_back_msg.start)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("end").ToLocalChecked(), Nan::New<Date>(Swap64(info->down_total_recv_back_msg.end)*1000).ToLocalChecked());
            break;
        }

        case 0x1201: {
            Nan::Set(msg, Nan::New("platformId").ToLocalChecked(), STR(info->reg.platformId));
            Nan::Set(msg, Nan::New("producerId").ToLocalChecked(), STR(info->reg.producerId));
            Nan::Set(msg, Nan::New("model").ToLocalChecked(), STR(info->reg.model));
            Nan::Set(msg, Nan::New("terminalId").ToLocalChecked(), STR(info->reg.terminalId));
            Nan::Set(msg, Nan::New("simno").ToLocalChecked(), STR(info->reg.simno));
            break;
        }

        case 0x1202:
        case 0x9202:
            packageGnss(msg, info->real_location.gnss);
            break;

        case 0x1203:
        case 0x9203: {
            uint8_t gnssCount = info->multiLocation.gnssCount;
            Local<Array> items = Nan::New<Array>(gnssCount);
            for (uint8_t i=0; i<gnssCount; i++) {
                Local<Object> item = Nan::New<Object>();
                packageGnss(item, info->multiLocation.gnss[i]);
                Nan::Set(items, i, item);
            }
            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            break;
        }

        case 0x1207:
        case 0x1209: {
            Nan::Set(msg, Nan::New("start").ToLocalChecked(), Nan::New<Date>(Swap64(info->startup.start)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("end").ToLocalChecked(), Nan::New<Date>(Swap64(info->startup.end)*1000).ToLocalChecked());
            break;
        }

        case 0x120a:
        case 0x120c:
            Nan::Set(msg, Nan::New("driverName").ToLocalChecked(), GBK(info->reportDriver.driverName));
            Nan::Set(msg, Nan::New("driverId").ToLocalChecked(), STR(info->reportDriver.driverId));
            Nan::Set(msg, Nan::New("license").ToLocalChecked(), GBK(info->reportDriver.license));
            Nan::Set(msg, Nan::New("orgName").ToLocalChecked(), GBK(info->reportDriver.orgName));
            break;

        case 0x9204:
        case 0x1601: {
            const char* p = info->carInfo.carInfo;
            const char* eof = p + (info->received - sizeof(VEHICLE_BASE_INFO));

            const char* label = nullptr, *labelend = nullptr, *value = nullptr, *valueend = nullptr, *comma = nullptr;
    
            for (; p<=eof; p++) {
                    
                if (p == eof || *p == ';') {
                            
                    if (label && label<eof) {
                        if (value)
                            valueend = p;
                        else {
                            labelend = p;
                            valueend = value = p;
                        }

                        while(label < labelend && ISSPACE(*label)) label++;
                        while(label < labelend && ISSPACE(*(labelend-1))) labelend--;

                        while(value < valueend && ISSPACE(*value)) value++;
                        while(value < valueend && ISSPACE(*(valueend-1))) valueend--;

                        // validate
                        bool valid = label < labelend && (ISALPHA(*label) || *label == '_');
                        if (valid) {
                            for (const char* m = label; m < labelend; m++) {
                                if (!(ISALPHA(*m) || *m == '_' || ISNUM(*m))) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                        if (valid) {
                            Nan::Set(msg, Nan::New(label, (labelend - label)).ToLocalChecked(), decodeGBK(value, (valueend - value)));
                        }
                    }
                    
                    label = nullptr;
                    value = nullptr;
                    continue;
                } 
                        
                if (!label)
                    label = p;

                if (!value) {
                    if (*p == ':') {
                        comma = p;
                    } else if (*p == '=') {
                        if ((comma+1) == p) {
                            labelend = comma;
                            value = p+1;
                        }
                    }
                }
            }
            return 0;
        }

        case 0x9205: 
        case 0x9206:
        case 0x9207:
        case 0x9208: 
        case 0x9209:
        case 0x1501:
        case 0x1505:
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(info->byteData.byteVal));
            break;

        case 0x1301:
        case 0x9301:
        case 0x9302:
            Nan::Set(msg, Nan::New("objectType").ToLocalChecked(), Nan::New(info->post_query.objtype));
            Nan::Set(msg, Nan::New("objectId").ToLocalChecked(), STR(info->post_query.objid));
            Nan::Set(msg, Nan::New("infoId").ToLocalChecked(), Nan::New(Swap32(info->post_query.infoid)));
            Nan::Set(msg, Nan::New("content").ToLocalChecked(), decodeGBK(info->post_query.content, info->received - sizeof(info->post_query)));
            return 0;

        case 0x1302:
            Nan::Set(msg, Nan::New("infoId").ToLocalChecked(), Nan::New(Swap32(info->info_ack.infoid)));
            break;

        case 0x1401:
            Nan::Set(msg, Nan::New("supervisionId").ToLocalChecked(), Nan::New(Swap32(info->urge_todo.supervisionId)));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(info->urge_todo.result));
            break;

        case 0x1402:
            Nan::Set(msg, Nan::New("warnSrc").ToLocalChecked(), Nan::New(info->adpt_info.warnSrc));
            Nan::Set(msg, Nan::New("warnType").ToLocalChecked(), Nan::New(Swap16(info->adpt_info.warnType)));
            Nan::Set(msg, Nan::New("warnTime").ToLocalChecked(), Nan::New<Date>(Swap64(info->adpt_info.warnTime)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("infoId").ToLocalChecked(), Nan::New(Swap32(info->adpt_info.infoId)));
            Nan::Set(msg, Nan::New("content").ToLocalChecked(), decodeGBK(info->adpt_info.content, info->received - sizeof(info->adpt_info)));
            return 0;

        case 0x1403:
            Nan::Set(msg, Nan::New("infoId").ToLocalChecked(), Nan::New(Swap32(info->adpt_todo.infoId)));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(info->adpt_todo.result));
            break;

        case 0x9401:
            Nan::Set(msg, Nan::New("warnSrc").ToLocalChecked(), Nan::New(info->warnUrgeTodoReq.warnSrc));
            Nan::Set(msg, Nan::New("warnType").ToLocalChecked(), Nan::New(Swap16(info->warnUrgeTodoReq.warnType)));
            Nan::Set(msg, Nan::New("warnTime").ToLocalChecked(), Nan::New<Date>(Swap64(info->warnUrgeTodoReq.warnTime)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("supervisionId").ToLocalChecked(), Nan::New(Swap32(info->warnUrgeTodoReq.supervisionId)));
            Nan::Set(msg, Nan::New("endTime").ToLocalChecked(), Nan::New<Date>(Swap64(info->warnUrgeTodoReq.endTime)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("level").ToLocalChecked(), Nan::New(info->warnUrgeTodoReq.level));
            Nan::Set(msg, Nan::New("supervisor").ToLocalChecked(), GBK(info->warnUrgeTodoReq.supervisor));
            Nan::Set(msg, Nan::New("phoneNumber").ToLocalChecked(),STR(info->warnUrgeTodoReq.phoneNumber));
            Nan::Set(msg, Nan::New("email").ToLocalChecked(), STR(info->warnUrgeTodoReq.email));
            break;

        case 0x9402:
        case 0x9403:
            Nan::Set(msg, Nan::New("warnSrc").ToLocalChecked(), Nan::New(info->warnInform.warnSrc));
            Nan::Set(msg, Nan::New("warnType").ToLocalChecked(), Nan::New(Swap16(info->warnInform.warnType)));
            Nan::Set(msg, Nan::New("warnTime").ToLocalChecked(), Nan::New<Date>(Swap64(info->warnInform.warnTime)*1000).ToLocalChecked());
            Nan::Set(msg, Nan::New("content").ToLocalChecked(), decodeGBK(info->warnInform.content, info->received - sizeof(info->warnInform)));
            return 0;

        case 0x1502: 
            Nan::Set(msg, Nan::New("flag").ToLocalChecked(), Nan::New(info->takePhotoAck.flag));
            packageGnss(msg, info->takePhotoAck.gnss);
            Nan::Set(msg, Nan::New("lensId").ToLocalChecked(), Nan::New(info->takePhotoAck.lensId));
            Nan::Set(msg, Nan::New("sizeType").ToLocalChecked(), Nan::New(info->takePhotoAck.sizeType));
            Nan::Set(msg, Nan::New("format").ToLocalChecked(), Nan::New(info->takePhotoAck.format));
            break;

        case 0x1503:
            Nan::Set(msg, Nan::New("ackId").ToLocalChecked(), Nan::New(Swap32(info->textInfoAck.ackId)));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(info->textInfoAck.result));
            break;

        case 0x1504:
            Nan::Set(msg, Nan::New("cmd").ToLocalChecked(), Nan::New(info->takeTravelAck.cmd));
            Nan::Set(msg, Nan::New("travelData").ToLocalChecked(), decodeGBK(info->takeTravelAck.data, info->received - sizeof(info->takeTravelAck)));
            break;

        case 0x9501:
            Nan::Set(msg, Nan::New("phoneNumber").ToLocalChecked(), STR(info->monitorVehicleReq.phoneNumber));
            break;

        case 0x9502:
            Nan::Set(msg, Nan::New("lensId").ToLocalChecked(), Nan::New(info->takePhotoReq.lensId));
            Nan::Set(msg, Nan::New("sizeType").ToLocalChecked(), Nan::New(info->takePhotoReq.size));
            break;

        case 0x9503: {
            Nan::Set(msg, Nan::New("sequence").ToLocalChecked(), Nan::New(Swap32(info->textInfo.sequence)));
            Nan::Set(msg, Nan::New("priority").ToLocalChecked(), Nan::New(info->textInfo.priority));
            Nan::Set(msg, Nan::New("content").ToLocalChecked(), decodeGBK(info->textInfo.content, (info->received - sizeof(info->textInfo))));
            break;
        }

        case 0x9504:
            Nan::Set(msg, Nan::New("cmd").ToLocalChecked(), Nan::New(info->byteData.byteVal));
            break;

        case 0x9505:
            Nan::Set(msg, Nan::New("authCode").ToLocalChecked(), BYTESTR(info->emergency_monitor_req.authCode));
            Nan::Set(msg, Nan::New("accessPoint").ToLocalChecked(), GBK(info->emergency_monitor_req.apName));
            Nan::Set(msg, Nan::New("username").ToLocalChecked(), GBK(info->emergency_monitor_req.username));
            Nan::Set(msg, Nan::New("password").ToLocalChecked(), GBK(info->emergency_monitor_req.password));
            Nan::Set(msg, Nan::New("serverIp").ToLocalChecked(), GBK(info->emergency_monitor_req.serverIp));
            Nan::Set(msg, Nan::New("tcpPort").ToLocalChecked(), Nan::New(Swap16(info->emergency_monitor_req.tcpPort)));
            Nan::Set(msg, Nan::New("udpPort").ToLocalChecked(), Nan::New(Swap16(info->emergency_monitor_req.udpPort)));
            Nan::Set(msg, Nan::New("endTime").ToLocalChecked(), Nan::New<Date>(Swap64(info->emergency_monitor_req.endTime)*1000).ToLocalChecked());
            break;
    }

    if (data_size && data) {
       Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::NewBuffer((char*)data, data_size).ToLocalChecked());
    }

    return 0;
}
