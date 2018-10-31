#include "node_808.h"
#include "utils.h"
#include <time.h>
#include "iconv.h"


static iconv_t iconv_h;
static char iconv_buf[0x2000];

static void initIconv() {
    static bool inited = false;
    if (!inited) {
        inited = true;
        iconv_h = iconv_open("UTF-8", "GBK");
    }
}

static uint32_t getIntProp(const Local<Object>& obj, const char* name, uint32_t defaultVal = 0) {
    Nan::HandleScope scope;
    Local<Value> cntVal = obj->Get(Nan::New(name).ToLocalChecked());
    return cntVal->IsUndefined() ? defaultVal : Nan::To<uint32_t>(cntVal).FromJust();
}


Local<Value> decodeGBK(const char* in, uint32_t inszie) {
    Nan::EscapableHandleScope scope;
    
    char* allocBuffer = nullptr;
    char* inPtr = (char*)in;
    size_t inbytesleft = inszie;
    size_t outBufSize = sizeof(iconv_buf);
    
    char* outPtr = (char*)iconv_buf;

    if (inbytesleft > sizeof(iconv_buf)) {
        outBufSize = inbytesleft;
        allocBuffer = new char[outBufSize];
        outPtr = allocBuffer;
    }

    size_t outbytesleft = outBufSize;

    initIconv();
    int ret = iconv(iconv_h, &inPtr, &inbytesleft, &outPtr, &outbytesleft);
 
    uint16_t convert_size = ret == 0 ? (uint16_t)(outBufSize-outbytesleft) : 0;

    Local<Value> value = Nan::New<String>(iconv_buf, convert_size).ToLocalChecked();
    if (allocBuffer)
        delete[] allocBuffer;

    return scope.Escape(value);
}




bool getBCD(uint8_t* out, uint8_t size, const char* in) {
    bool allzero = true;
    for (uint8_t i=0; i<size; i++) {
        uint8_t v = (uint8_t)in[i];
        out[i] = (v>>4) *10 + (v&0xf);
        if (out[i])
            allzero = false;
    }
    return allzero;
}



Local<Value> decodeBcd6Date(const char* in) {
    Nan::EscapableHandleScope scope;

    uint8_t bcd[6];
    bool allzero = getBCD(bcd, 6, in);
    if (allzero) {
        return scope.Escape(Nan::Undefined());
    }

    tm tmObj; 
    tmObj.tm_year = (2000 + bcd[0])-1900; 
    tmObj.tm_mon  = bcd[1]>0? bcd[1]-1 : 0; 
    tmObj.tm_mday = bcd[2]>0? bcd[2] : 1; 
    tmObj.tm_hour = bcd[3]; 
    tmObj.tm_min  = bcd[4];
    tmObj.tm_sec  = bcd[5];
    tmObj.tm_isdst= -1; 
    time_t ttime = mktime(&tmObj); 

    return scope.Escape(Nan::New<Date>((uint64_t)ttime*1000).ToLocalChecked());
}

// dmyy hms
Local<Value> decodeOct7Date(const uint8_t* in) {
    Nan::EscapableHandleScope scope;

    tm tmObj; 
    tmObj.tm_year = (((uint16_t)in[2]<<8)|in[3])-1900; 
    tmObj.tm_mon  = in[1]; 
    tmObj.tm_mday = in[0];
    tmObj.tm_hour = in[4]; 
    tmObj.tm_min  = in[5];
    tmObj.tm_sec  = in[6];
    tmObj.tm_isdst= -1; 
    time_t ttime = mktime(&tmObj); 

    return scope.Escape(Nan::New<Date>((uint64_t)ttime*1000).ToLocalChecked());
}



typedef void (*paramcallback)();
struct param {
    unsigned int id;
    unsigned char range;
    unsigned char type;
    const char* name;
};

static param params[] = {
    {0x0001,    6,  0, "heartBeatInterval"},
    {0x0010,    7,  1, "APN"},
    {0x0018,    1,  0, "TCPPort"},
    {0x001a,    0,  1, "ICServerIP"},
    {0x001b,    1,  0, "ICServerTCPPort"},
    {0x001d,    0,  1, "backupICServerIP"},
    {0x0020,    2,  0, "positionPolicy"},
    {0x0027,    2,  0, "idleInterval"},
    {0x002c,    5,  0, "defaultDistinceInterval"},
    {0x0040,    4,  1, "platformPhone"},
    {0x0045,    2,  0, "callAnswerPolicy"},
    {0x0048,    1,  1, "monitorPhone"},
    {0x0050,    14,  0, "dword"},
    {0x0064,    1,  0, "distinceCameraSet"},
    {0x0070,    4,  0, "dword"},
    {0x0080,    2,  0, "dword"},
    {0x0083,    0,  1, "license"},
    {0x0084,    0,  0, "color"},
    {0x0090,    5,  0, "int"},
    {0x0100,    3,  0, "int"}
};


Local<Array> parseItem0104(uint32_t id, uint8_t len, const uint8_t* p) {

    Nan::EscapableHandleScope scope;

    param* ptr = nullptr;

    for (unsigned int i=0; i<arraysize(params); i++) {
        if (params[i].id <= id && (params[i].id+params[i].range) >= id) {
            ptr = &params[i];
             break;
        }

        if (params[i].id > id) {
            break;
        }
    }

    Local<Array> item = Nan::New<Array>(2);
    Nan::Set(item, 0, Nan::New(id));
    if (ptr && ptr->type == 0) {
        Nan::Set(item, 1, Nan::New(PINTX(p, len)));
    } else if (ptr && ptr->type == 1) {
        Nan::Set(item, 1, Nan::New((char*)p, len).ToLocalChecked());
    } else {
        Local<Object> databuf = Nan::CopyBuffer((const char*)p, len).ToLocalChecked();
        Nan::Set(item, 1, databuf);
    }

    return scope.Escape(item);
}


static const char* P0200_CODES[] = {
    nullptr,
    "mileage",
    "oil",
    "boardSpeed",
    "alarmEvent",
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr, // 0x11
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    "signal", // 0x25
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    "ioStatus",
    "analog",
    nullptr,
    nullptr,
    nullptr,
    nullptr,
    "netSignal",
    "gnssSatlite"
};

//
//

template<class T>
uint16_t setPositionData(Local<Object>& ret, const T& info, const uint8_t* raw, uint16_t rawSize) {
    Nan::HandleScope scope;

    Nan::Set(ret, Nan::New("alarms").ToLocalChecked(), Nan::New(Swap32(info.alarms)));
    Nan::Set(ret, Nan::New("status").ToLocalChecked(), Nan::New(Swap32(info.status)));
    Nan::Set(ret, Nan::New("lat").ToLocalChecked(), Nan::New(((double)Swap32(info.lat))/1000000));
    Nan::Set(ret, Nan::New("lng").ToLocalChecked(), Nan::New(((double)Swap32(info.lng))/1000000));
    Nan::Set(ret, Nan::New("altitude").ToLocalChecked(), Nan::New(Swap16(info.altitude)));
    Nan::Set(ret, Nan::New("speed").ToLocalChecked(), Nan::New(Swap16(info.speed)));
    Nan::Set(ret, Nan::New("direction").ToLocalChecked(), Nan::New(Swap16(info.direction)));
    Nan::Set(ret, Nan::New("time").ToLocalChecked(), decodeBcd6Date(info.time));

    if (!raw || !rawSize)
        return 0;

    Local<Array> items = Nan::New<Array>();
    unsigned int itemsCount = 0;

    const uint8_t* pEnd = (raw + rawSize);
    const uint8_t* p = raw;

    uint8_t marked[0x100] = {0};

    while ((p+2) <= pEnd) {
        uint8_t id = *(p);
        uint8_t len = *(p+1);
        p += 2;

        if ((p+len) > pEnd)
            break;

        // to skip trash data
        if (marked[id]) {
            p += len;
            continue;
        }

        if (id == 0x11) {
            if (len == 1 || len == 5) {
                uint8_t type = *(p) <5 ? *(p) : 0;
                Nan::Set(ret, Nan::New("overspeedRegionType").ToLocalChecked(), Nan::New(type));
                if (type)
                    Nan::Set(ret, Nan::New("overspeedRegionId").ToLocalChecked(), Nan::New(PINT32(p+1)));
            }

        } else if (id == 0x12) {
            // over speed info
            if (len == 6) {
                uint8_t type = *(p) <5 ? *(p) : 0;
                bool in = (*(p+5)==0);

                Nan::Set(ret, Nan::New("inOutRegionType").ToLocalChecked(), Nan::New(type));
                Nan::Set(ret, Nan::New("inOutRegionId").ToLocalChecked(), Nan::New(PINT32(p+1)));
                Nan::Set(ret, Nan::New(in ? "inRegion" : "outRegion").ToLocalChecked(), Nan::New(true));
            }

        } else if (id == 0x13) {
            // over speed info
            if (len == 7) {
                bool shorting = (*(p+6))==0;
                int time = (int)PINT16(p+4);
                if (shorting)
                    time = -time;
                Nan::Set(ret, Nan::New("drivingRouteId").ToLocalChecked(), Nan::New(PINT32(p)));
                Nan::Set(ret, Nan::New("drivingTime").ToLocalChecked(), Nan::New(time));
            }

        } else if (id >= arraysize(P0200_CODES) || !P0200_CODES[id]) {
            Local<Array> item = Nan::New<Array>(2);
            Nan::Set(item, 0, Nan::New(id));
            Local<Object> databuf = Nan::CopyBuffer((const char*)p, len).ToLocalChecked();
            Nan::Set(item, 1, databuf);
            Nan::Set(items, itemsCount++, item);
        } else {
            if (len == 1 || len == 2 || len == 4)
                Nan::Set(ret, Nan::New(P0200_CODES[id]).ToLocalChecked(), Nan::New(PINTX(p, len)));
        }
        marked[id] = 1;
        p += len;
    }

    if (itemsCount) {
        Nan::Set(ret, Nan::New("addons").ToLocalChecked(), items);
    }

    return (uint16_t)(p - raw);
}



#define ALIGING_SIZE(x)                                              \
do {                                                                 \
    if (!nextPackage) {                                              \
        rawData = data->buffer + (x);                                \
        if (data->received < (x)) {                                  \
            memset(data->buffer + data->received, 0, (x) - data->received); \
            rawDataSize = 0;                                         \
        } else                                                       \
            rawDataSize = data->received - (x);                      \
    }                                                                \
} while(0)


#define ALIGING_ITEM(T)    ALIGING_SIZE(sizeof(data->T))



#define PADDING_DATA()                                               \
do {                                                                 \
    rawData = data->buffer;                                          \
    rawDataSize = data->received;                                    \
    Local<Value> padingObj =                                         \
        msg->Get(Nan::New("_padding").ToLocalChecked());             \
    if (padingObj->IsUint8Array()) {                                 \
        Local<Object> bufobj = padingObj.As<Object>();               \
        char* paddata = node::Buffer::Data(bufobj);                  \
        uint32_t padsize = node::Buffer::Length(bufobj);             \
        if (padsize > sizeof(data->__padding))                       \
            padsize = sizeof(data->__padding);                       \
                                                                     \
        rawData =                                                    \
          data->__padding + sizeof(data->__padding) - padsize;       \
        rawDataSize += padsize;                                      \
        memcpy(rawData, paddata, padsize);                           \
    }                                                                \
} while(0)



#define SAVING_TAIL()                                                \
do {                                                                 \
    if (pEnd > p) {                                                  \
        Nan::Set(msg, Nan::New("_padding").ToLocalChecked(),         \
          Nan::CopyBuffer((char*)p, pEnd-p).ToLocalChecked());       \
    } else {                                                         \
        Nan::Delete(msg, Nan::New("_padding").ToLocalChecked());     \
    }                                                                \
} while(0)




uint16_t bundlePackage(Local<Object>& msg, 
                    uint16_t messageId, 
                    uint16_t package_count,
                    uint16_t package_index,
                    pkg_content* data) {

    Nan::HandleScope scope;    

    const bool nextPackage = (package_count > 0 && package_index > 1);
    char* rawData = data->buffer;
    uint16_t rawDataSize = data->received;
    if (nextPackage) {
        //if (raw.lastLeftSize) {
          //  memcpy(raw.lastLeft+raw.lastLeftSize, data->buffer, data->received);
            //rawData = raw.lastLeft;
        //    rawDataSize = raw.lastLeftSize + data->received;
        //    raw.lastLeftSize = 0;
        //}
    }

    switch (messageId) {
        case 0x0001:
        case 0x8001: {
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->ack.ackSN)));
            Nan::Set(msg, Nan::New("ackId").ToLocalChecked(), Nan::New(Swap16(data->ack.ackId)));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(data->ack.result));
            return 0;
        }

        case 0x0100: {
            ALIGING_ITEM(reg);
            Nan::Set(msg, Nan::New("province").ToLocalChecked(), Nan::New(Swap16(data->reg.province)));
            Nan::Set(msg, Nan::New("city").ToLocalChecked(), Nan::New(Swap16(data->reg.city)));
            Nan::Set(msg, Nan::New("manufactor").ToLocalChecked(), Nan::New(data->reg.manufactor, sizeof(data->reg.manufactor)).ToLocalChecked());
            uint8_t ssize = sizeof(data->reg.model);
            for (; ssize>0 && data->reg.model[ssize-1]==0; ssize--);
            Nan::Set(msg, Nan::New("model").ToLocalChecked(), Nan::New(data->reg.model, ssize).ToLocalChecked());
            ssize = sizeof(data->reg.terminalId);
            for (; ssize>0 && data->reg.terminalId[ssize-1]==0; ssize--);
            Nan::Set(msg, Nan::New("termNo").ToLocalChecked(), Nan::New(data->reg.terminalId, ssize).ToLocalChecked());
            Nan::Set(msg, Nan::New("color").ToLocalChecked(), Nan::New(data->reg.color));
            ssize = sizeof(data->reg.plateNo);
            for (; ssize>0 && data->reg.plateNo[ssize-1]==0; ssize--);
            Nan::Set(msg, Nan::New("license").ToLocalChecked(), decodeGBK(data->reg.plateNo, ssize));
            return 0;
        }

        case 0x8003: {
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->resend.ackSN)));
            Local<Array> items = Nan::New<Array>(data->resend.count);
            for (uint8_t i=0; i<data->resend.count; i++) {
                Nan::Set(items, i, Nan::New(Swap16(data->resend.ids[i])));
            }
            Nan::Set(msg, Nan::New("ids").ToLocalChecked(), items);
            return 0;
        }

        case 0x0102:
            Nan::Set(msg, Nan::New("token").ToLocalChecked(), Nan::New(rawData, rawDataSize).ToLocalChecked());
            return 0;

        case 0x8100: {
            ALIGING_ITEM(regAck);
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->regAck.ackSN)));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(data->regAck.result));
            Nan::Set(msg, Nan::New("token").ToLocalChecked(), Nan::New(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x8103: {
            ALIGING_ITEM(byte_val);
            uint8_t parsed = 0;
     
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+5) <= pEnd && parsed < data->byte_val) {
                uint32_t id = PINT32(p);
                uint8_t len = *(p+4);
                p += 5;
                if ((p+len) > pEnd)
                    break;

                Nan::Set(items, itemsCount++, parseItem0104(id, len, p));
                p += len;
                parsed++;
            }
            Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(data->byte_val));
            Nan::Set(msg, Nan::New("params").ToLocalChecked(), items);
            return 0;
        }

        case 0x0200:
            ALIGING_ITEM(loc);
            setPositionData(msg, data->loc, (uint8_t*)rawData, rawDataSize);
            return 0;

        case 0x0201:
        case 0x0500: {
            ALIGING_ITEM(locAck);
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->locAck.ackSN)));
            setPositionData(msg, data->locAck, (uint8_t*)rawData, rawDataSize);
            return 0;
        }

        case 0x0302:
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->answer.ackSN)));
            Nan::Set(msg, Nan::New("answer").ToLocalChecked(), Nan::New(data->answer.answer));
            return 0;

        case 0x0303:
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->iod.type));
            Nan::Set(msg, Nan::New("cancel").ToLocalChecked(), Nan::New(data->iod.flag==0));
            return 0;

        case 0x0702: {
            ALIGING_ITEM(driver);
            Nan::Set(msg, Nan::New("on").ToLocalChecked(), Nan::New(data->driver.status == 0x01));
            Nan::Set(msg, Nan::New("time").ToLocalChecked(), decodeBcd6Date(data->driver.time));

            if (data->driver.status == 0x01) {
                uint8_t cardRead = *rawData++;
                Nan::Set(msg, Nan::New("cardRead").ToLocalChecked(), Nan::New(cardRead));
        
                if (cardRead == 0) {
                    uint8_t len = *rawData++;
                    Nan::Set(msg, Nan::New("driverName").ToLocalChecked(), decodeGBK(rawData, len)); 
                    rawData+=len;

                    len = 20;
                    for (; len>0 && rawData[len-1]==0; len--);
                    Nan::Set(msg, Nan::New("license").ToLocalChecked(), decodeGBK(rawData, len));
                    rawData += 20;

                    len = *rawData++;
                    Nan::Set(msg, Nan::New("licenseBy").ToLocalChecked(), decodeGBK(rawData, len)); 
                    rawData+=len;

                    // yy MM dd hh mm ss
                    uint8_t bcd[4];
                    bool allzero = getBCD(bcd, 4, rawData);
                    if (allzero) {
                        Nan::Set(msg, Nan::New("expirationDate").ToLocalChecked(), Nan::Null());
                        return 0;
                    }

                    tm tmObj; 
                    tmObj.tm_year = (bcd[0]*100+bcd[1])-1900; 
                    tmObj.tm_mon  = bcd[2]>0 ? bcd[2]-1 : 0; 
                    tmObj.tm_mday = bcd[3]>0 ? bcd[3] : 1;
                    tmObj.tm_hour = 0; 
                    tmObj.tm_min  = 0;
                    tmObj.tm_sec  = 0;
                    tmObj.tm_isdst= -1; 
                    time_t ttime = mktime(&tmObj); 
                    Nan::Set(msg, Nan::New("expirationDate").ToLocalChecked(), Nan::New<Date>((uint64_t)ttime*1000).ToLocalChecked());
                }
            }
            return 0;
        }

        case 0x0704: {
            uint16_t total, parsed = 0;
            ALIGING_ITEM(bulkLoc);
            if (!nextPackage) {
                total = Swap16(data->bulkLoc.count);
                Nan::Set(msg, Nan::New("count").ToLocalChecked(), Nan::New(total));
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->bulkLoc.type));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "count", 0xffff);
                parsed = getIntProp(msg, "_parsed");
            }
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+30) <= pEnd && parsed < total) {
                uint16_t length = PINT16(p);
                if (length < 28 || (p+2+length) > pEnd)
                    break;

                p+=2;

                Local<Object> item = Nan::New<Object>();
                LOCATION pos;
                memcpy(&pos, p, sizeof(pos));
                setPositionData(item, pos, p+28, length-28);
                p += length;

                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x0301: 
            Nan::Set(msg, Nan::New("event").ToLocalChecked(), Nan::New(data->byte_val)); 
            return 0;

        case 0x8105: {
            ALIGING_ITEM(byte_val);
            Nan::Set(msg, Nan::New("cmd").ToLocalChecked(), Nan::New(data->byte_val)); 
            Nan::Set(msg, Nan::New("params").ToLocalChecked(), decodeGBK(rawData, rawDataSize));
            return 0;
        }

        case 0x8106:
        case 0x8601:
        case 0x8603:
        case 0x8605:
        case 0x8607: {
            Local<Array> items = Nan::New<Array>(data->setIds32.count);
            for (uint8_t i=0; i<data->setIds32.count; i++) {
                Nan::Set(items, i, Nan::New(Swap32(data->setIds32.ids[i])));
            }
            Nan::Set(msg, Nan::New("ids").ToLocalChecked(), items);
            return 0;
        }

        case 0x0104: {
            uint8_t parsed = 0;
            ALIGING_ITEM(paramsAck);

            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->paramsAck.ackSN)));
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+5) <= pEnd && parsed < data->paramsAck.count) {
                uint32_t id = PINT32(p);
                uint8_t len = *(p+4);
                p += 5;
                if ((p+len) > pEnd)
                    break;

                Nan::Set(items, itemsCount++, parseItem0104(id, len, p));
                p += len;
                parsed++;
            }

            Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(data->paramsAck.count));
            Nan::Set(msg, Nan::New("params").ToLocalChecked(), items);
            return 0;
        }

        case 0x0107: {
            ALIGING_ITEM(propAck);
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(Swap16(data->propAck.prop)));
            Nan::Set(msg, Nan::New("manufactor").ToLocalChecked(), Nan::New(data->propAck.manufactor, sizeof(data->propAck.manufactor)).ToLocalChecked());
            uint8_t ssize = sizeof(data->propAck.model);
            for (; ssize>0 && data->propAck.model[ssize-1]==0; ssize--);
            Nan::Set(msg, Nan::New("model").ToLocalChecked(), Nan::New(data->propAck.model, ssize).ToLocalChecked());
            ssize = sizeof(data->propAck.terminalId);
            for (; ssize>0 && data->propAck.terminalId[ssize-1]==0; ssize--);
            Nan::Set(msg, Nan::New("termNo").ToLocalChecked(), Nan::New(data->propAck.terminalId, ssize).ToLocalChecked());
            char iccid[20];
            for (uint8_t i=0; i<10; i++) {
                uint8_t ch = (uint8_t)data->propAck.iccid[i];
                iccid[i*2] = (ch>>4) + '0';
                iccid[i*2+1] = (ch&0xf) + '0';
            }
            Nan::Set(msg, Nan::New("iccid").ToLocalChecked(), Nan::New(iccid, sizeof(iccid)).ToLocalChecked());

            uint8_t len = *rawData++;
            Nan::Set(msg, Nan::New("hw").ToLocalChecked(), Nan::New(rawData, len).ToLocalChecked());
            rawData += len;

            len = *rawData++;
            Nan::Set(msg, Nan::New("fw").ToLocalChecked(), Nan::New(rawData, len).ToLocalChecked());
            rawData += len;

            Nan::Set(msg, Nan::New("gnss").ToLocalChecked(), Nan::New((uint8_t)*rawData));
            Nan::Set(msg, Nan::New("comm").ToLocalChecked(), Nan::New((uint8_t)*(rawData+1)));

            return 0;
        }

        case 0x8108: {
            uint32_t total, parsed;
            if (!nextPackage) {
                ALIGING_SIZE(7+data->upgrade.versionLength+4);
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->upgrade.upgradeType));
                Nan::Set(msg, Nan::New("manufactor").ToLocalChecked(), Nan::New(data->upgrade.manufactor, sizeof(data->upgrade.manufactor)).ToLocalChecked());
                Nan::Set(msg, Nan::New("version").ToLocalChecked(), Nan::New(data->upgrade.version, data->upgrade.versionLength).ToLocalChecked());
                total = PINT32(data->upgrade.version + data->upgrade.versionLength);
                parsed = 0;
                Nan::Set(msg, Nan::New("length").ToLocalChecked(), Nan::New(total));
            } else {
                total = getIntProp(msg, "length", 0xffffffff);
                parsed = getIntProp(msg, "_parsed"); 
            }

            rawDataSize = std::min(rawDataSize, (uint16_t)(total - parsed));
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed + rawDataSize));
            return 0;
        }

        case 0x0108:
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->upgradeAck.upgradeType));
            Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(data->upgradeAck.result));
            return 0;

        case 0x8202:
            Nan::Set(msg, Nan::New("interval").ToLocalChecked(), Nan::New(Swap16(data->track.interval)));
            Nan::Set(msg, Nan::New("duration").ToLocalChecked(), Nan::New(Swap32(data->track.duration)));
            return 0;

        case 0x8203:
            Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->confirmAlarm.ackSN)));
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(Swap32(data->confirmAlarm.alarmType)));
            return 0;

        case 0x8300: {
            ALIGING_ITEM(byte_val);
            Nan::Set(msg, Nan::New("flag").ToLocalChecked(), Nan::New(data->byte_val)); 
            Nan::Set(msg, Nan::New("text").ToLocalChecked(), decodeGBK(rawData, rawDataSize));
            return 0;
        }

        case 0x8301: {
            uint8_t total, parsed = 0;
            ALIGING_ITEM(setEvent);
            if (!nextPackage) {
                total = data->setEvent.count;
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->setEvent.type));
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xff);
                parsed = getIntProp(msg, "_parsed");
            }
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+2) <= pEnd && parsed < total) {
                uint8_t id = *(p);
                uint8_t len = *(p+1);
                p += 2;
                if ((p+len) > pEnd)
                    break;

                Local<Array> item = Nan::New<Array>(2);
                Nan::Set(item, 0, Nan::New(id));
                Nan::Set(item, 1, decodeGBK((char*)p, len));
                p += len;
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("events").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x8302: {
            if (!nextPackage) {
                ALIGING_SIZE(2 + data->question.titleLength);
                Nan::Set(msg, Nan::New("flag").ToLocalChecked(), Nan::New(data->question.flag));
                Nan::Set(msg, Nan::New("question").ToLocalChecked(), decodeGBK(data->question.title, data->question.titleLength));
            } else {
                PADDING_DATA();
            }
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+3) <= pEnd) {
                uint8_t id = *(p);
                uint16_t len = PINT16(p+1);

                if ((p+3+len) > pEnd)
                    break;

                p += 3;

                Local<Array> item = Nan::New<Array>(2);
                Nan::Set(item, 0, Nan::New(id));
                Nan::Set(item, 1, decodeGBK((char*)p, len));
                p += len;
                Nan::Set(items, itemsCount++, item);
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("answers").ToLocalChecked(), items);
            return 0;
        }

        case 0x8303: {
            uint8_t total, parsed = 0;
            ALIGING_ITEM(iodSet);
            if (!nextPackage) {
                total = data->iodSet.count;
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->iodSet.type));
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xff);
                parsed = getIntProp(msg, "_parsed");
            }
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+3) <= pEnd && parsed < total) {
                uint8_t id = *(p);
                uint8_t len = PINT16(p+1);

                if ((p+3+len) > pEnd)
                    break;

                p += 3;
                
                Local<Array> item = Nan::New<Array>(2);
                Nan::Set(item, 0, Nan::New(id));
                Nan::Set(item, 1, decodeGBK((char*)p, len));
                p += len;
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("infos").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x8304: {
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->info.type)); 
            uint16_t length = std::min(1020, Swap16(data->info.contentLength));
            Nan::Set(msg, Nan::New("length").ToLocalChecked(), Nan::New(length)); 
            Nan::Set(msg, Nan::New("content").ToLocalChecked(), decodeGBK(data->info.content, length)); 
            return 0;
        }

        case 0x8400: {
            ALIGING_ITEM(byte_val);
            Nan::Set(msg, Nan::New("monitor").ToLocalChecked(), Nan::New(!!data->byte_val)); 
            Nan::Set(msg, Nan::New("phone").ToLocalChecked(), Nan::New(rawData, rawDataSize).ToLocalChecked()); 
            return 0;
        }

        case 0x8401: {
            uint8_t total, parsed = 0;
            ALIGING_ITEM(phonebook);
            if (!nextPackage) {
                total = data->phonebook.count;
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->phonebook.type)); 
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total)); 
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xff);
                parsed = getIntProp(msg, "_parsed");
            }
            
            Local<Array> items = Nan::New<Array>();
            uint8_t itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+2) <= pEnd && parsed < total) {

                uint8_t flag = *(p);
                uint8_t phonelen = *(p+1);
                p += 2;
                if ((p+phonelen) > pEnd) 
                    break;
                const char* phone = (const char*)p;
                p += phonelen;
                uint8_t namelen = *(p);
                p++;
                if ((p+namelen) > pEnd) 
                    break;
                
                Local<Object> item = Nan::New<Object>();
                Nan::Set(item, Nan::New("flag").ToLocalChecked(), Nan::New(flag));
                Nan::Set(item, Nan::New("phone").ToLocalChecked(), Nan::New(phone, phonelen).ToLocalChecked());
                Nan::Set(item, Nan::New("name").ToLocalChecked(), decodeGBK((const char*)p, namelen));

                Nan::Set(items, itemsCount++, item);

                p += namelen;
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x8500: 
            Nan::Set(msg, Nan::New("flag").ToLocalChecked(), Nan::New(data->byte_val)); 
            return 0;

        case 0x8600:
        case 0x8602: {
            ALIGING_ITEM(setRegion);
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->setRegion.prop)); 
            Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(data->setRegion.count));

            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+18) <= pEnd) {
                const uint8_t* xp = p;
                uint32_t id = PINT32(xp);
                uint16_t prop = PINT16(xp+4);
                uint32_t lat = PINT32(xp+6);
                uint32_t lng = PINT32(xp+10);
                xp += 14;
                uint32_t lat1 = 0;
                uint32_t lng1 = 0;
                uint32_t radius = 0;
                
                if (messageId == 0x8600) {
                    radius = PINT32(xp);
                    xp += 4;
                } else {
                    lat1 = PINT32(xp);
                    lng1 = PINT32(xp+4);
                    xp += 8;
                    if (xp > pEnd)
                        break;
                }

                uint8_t addsize = 0;
                if (prop & 0x01) {
                    addsize = 12;
                }

                if (prop & 0x02) {
                    addsize = 3;
                }

                if (xp + addsize > pEnd)
                    break;

                Local<Object> item = Nan::New<Object>();
                Nan::Set(item, Nan::New("id").ToLocalChecked(), Nan::New(id));
                Nan::Set(item, Nan::New("prop").ToLocalChecked(), Nan::New(prop));
                Nan::Set(item, Nan::New("lat").ToLocalChecked(), Nan::New(((double)lat)/1000000));
                Nan::Set(item, Nan::New("lng").ToLocalChecked(), Nan::New(((double)lng)/1000000));
                if (messageId == 0x8600) {
                    Nan::Set(item, Nan::New("radius").ToLocalChecked(), Nan::New(radius));
                } else {
                    Nan::Set(item, Nan::New("lat1").ToLocalChecked(), Nan::New(((double)lat1)/1000000));
                    Nan::Set(item, Nan::New("lng1").ToLocalChecked(), Nan::New(((double)lng1)/1000000));
                }

                if (prop & 0x01) {
                    Nan::Set(item, Nan::New("start").ToLocalChecked(), decodeBcd6Date((char*)xp));
                    Nan::Set(item, Nan::New("end").ToLocalChecked(), decodeBcd6Date((char*)xp+6));
                    xp += 12;
                }

                if (prop & 0x02) {
                    Nan::Set(item, Nan::New("speedLimit").ToLocalChecked(), Nan::New(PINT16(xp)));
                    Nan::Set(item, Nan::New("speedLimitTime").ToLocalChecked(), Nan::New(*(xp+2)));
                    xp += 3;
                }
                p = xp;
                Nan::Set(items, itemsCount++, item);
            }

            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            return 0;
        }

        case 0x0700: {
            ALIGING_ITEM(vehicleRecord);
            if (!nextPackage) {
                Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->vehicleRecord.ackSN)));
                Nan::Set(msg, Nan::New("cmd").ToLocalChecked(), Nan::New(data->vehicleRecord.cmd));
            }
            
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x0701: {
            ALIGING_ITEM(dword_val);
            uint32_t total, parsed;
            if (!nextPackage) {
                total = Swap32(data->dword_val);
                parsed = 0;
                Nan::Set(msg, Nan::New("length").ToLocalChecked(), Nan::New(total));
            } else {
                total = getIntProp(msg, "length", 0xffffffff);
                parsed = getIntProp(msg, "_parsed"); 
            }
            
            rawDataSize = std::min(rawDataSize, (uint16_t)(total - parsed));
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed + rawDataSize));
            return 0;
        }

        case 0x0705: {
            uint16_t total, parsed;
            ALIGING_ITEM(canUpload);
            if (!nextPackage) {
                total = Swap16(data->canUpload.count);
                parsed = 0;

                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
                uint8_t bcd[5];
                getBCD(bcd, 5, data->canUpload.time);

                // hh-mm-ss-msms -> ms 
                uint32_t ms = ((uint32_t)bcd[0])*(60*60*1000) +
                            ((uint32_t)bcd[1])*(60*1000) +
                            ((uint32_t)bcd[2])*(1000) +
                            (bcd[3]*10) + bcd[4];
                Nan::Set(msg, Nan::New("milliseconds").ToLocalChecked(), Nan::New(ms));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xffff);
                parsed = getIntProp(msg, "_parsed");
            }
            

            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+12) <= pEnd && parsed < total) {
                Local<Array> item = Nan::New<Array>(2);
                Nan::Set(item, 0, Nan::New(PINT32(p)));
                Local<Object> databuf = Nan::CopyBuffer((char*)(p+4), 8).ToLocalChecked();
                Nan::Set(item, 1, databuf);

                p += 12;
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x8700:
        case 0x8701: {
            ALIGING_ITEM(byte_val);
            Nan::Set(msg, Nan::New("cmd").ToLocalChecked(), Nan::New(data->byte_val));
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x0800:
            Nan::Set(msg, Nan::New("mediaId").ToLocalChecked(), Nan::New(Swap32(data->mediaInfo.id)));
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->mediaInfo.type));
            Nan::Set(msg, Nan::New("format").ToLocalChecked(), Nan::New(data->mediaInfo.format));
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(data->mediaInfo.code));
            Nan::Set(msg, Nan::New("channel").ToLocalChecked(), Nan::New(data->mediaInfo.channel));
            return 0;

        case 0x8800: {
            Local<Array> items = Nan::New<Array>(data->mediaAck.count);

            for (uint8_t i=0; i<data->mediaAck.count; i++) {
                Nan::Set(items, i, Nan::New(Swap16(data->mediaAck.ids[i])));
            }

            Nan::Set(msg, Nan::New("mediaId").ToLocalChecked(), Nan::New(Swap32(data->mediaAck.mediaId)));
            Nan::Set(msg, Nan::New("ids").ToLocalChecked(), items);
            return 0;
        }

        case 0x8801:
            Nan::Set(msg, Nan::New("channel").ToLocalChecked(), Nan::New(data->shotting.channel));
            if (data->shotting.cmd == 0) {
                Nan::Set(msg, Nan::New("stop").ToLocalChecked(), Nan::New(true));
            } else if (data->shotting.cmd == 0xffff) {
                Nan::Set(msg, Nan::New("video").ToLocalChecked(), Nan::New(true));
            } else {
                Nan::Set(msg, Nan::New("pictures").ToLocalChecked(), Nan::New(Swap16(data->shotting.cmd)));
            }
            Nan::Set(msg, Nan::New("duration").ToLocalChecked(), Nan::New(Swap16(data->shotting.duration)));
            Nan::Set(msg, Nan::New("upload").ToLocalChecked(), Nan::New(data->shotting.store==0));
            Nan::Set(msg, Nan::New("resolution").ToLocalChecked(), Nan::New(data->shotting.resolution));
            Nan::Set(msg, Nan::New("quality").ToLocalChecked(), Nan::New(data->shotting.quality));
            Nan::Set(msg, Nan::New("brightness").ToLocalChecked(), Nan::New(data->shotting.brightness));
            Nan::Set(msg, Nan::New("contrast").ToLocalChecked(), Nan::New(data->shotting.contrast));
            Nan::Set(msg, Nan::New("saturation").ToLocalChecked(), Nan::New(data->shotting.saturation));
            Nan::Set(msg, Nan::New("chroma").ToLocalChecked(), Nan::New(data->shotting.chroma));
            return 0;

        case 0x8802: {
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->uploadMediaEx.type));
            Nan::Set(msg, Nan::New("channel").ToLocalChecked(), Nan::New(data->uploadMediaEx.channel));
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(data->uploadMediaEx.code));
            Nan::Set(msg, Nan::New("start").ToLocalChecked(), decodeBcd6Date(data->uploadMediaEx.start));
            Nan::Set(msg, Nan::New("end").ToLocalChecked(), decodeBcd6Date(data->uploadMediaEx.end));
            return 0;
        }

        case 0x8803: {
            Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->uploadMediaEx.type));
            Nan::Set(msg, Nan::New("channel").ToLocalChecked(), Nan::New(data->uploadMediaEx.channel));
            Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(data->uploadMediaEx.code));
            Nan::Set(msg, Nan::New("start").ToLocalChecked(), decodeBcd6Date(data->uploadMediaEx.start));
            Nan::Set(msg, Nan::New("end").ToLocalChecked(), decodeBcd6Date(data->uploadMediaEx.end));
            Nan::Set(msg, Nan::New("del").ToLocalChecked(), Nan::New(data->uploadMediaEx.del == 1));
            return 0;
        }

        case 0x0802: {
            ALIGING_ITEM(mediaQueryAck);
            uint16_t total, parsed = 0;
            if (!nextPackage) {
                total = Swap16(data->mediaQueryAck.count);
                Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->mediaQueryAck.ackSN)));
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xffff);
                parsed = getIntProp(msg, "_parsed");
            }  

            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+35) <= pEnd && parsed <total) {
                Local<Object> item = Nan::New<Object>();
                Nan::Set(item, Nan::New("mediaId").ToLocalChecked(), Nan::New(PINT32(p)));
                Nan::Set(item, Nan::New("type").ToLocalChecked(), Nan::New(*(p+4)));
                Nan::Set(item, Nan::New("channel").ToLocalChecked(), Nan::New(*(p+5)));
                Nan::Set(item, Nan::New("code").ToLocalChecked(), Nan::New(*(p+6)));

                LOCATION pos;
                memcpy(&pos, p+7, sizeof(pos));
                setPositionData(item, pos, nullptr, 0);
                p += 35;
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("items").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x0805: {
            ALIGING_ITEM(shotAck);
            uint16_t total, parsed;
            if (!nextPackage) {
                total = Swap16(data->shotAck.count);
                parsed = 0;
                Nan::Set(msg, Nan::New("ackSN").ToLocalChecked(), Nan::New(Swap16(data->shotAck.ackSN)));
                Nan::Set(msg, Nan::New("result").ToLocalChecked(), Nan::New(data->shotAck.result));
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xffff);
                parsed = getIntProp(msg, "_parsed"); 
            }
            
            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+4) <= pEnd && parsed <total) {
                Nan::Set(items, itemsCount++, Nan::New(PINT32(p)));
                p += 4;
                parsed++;
            }
            SAVING_TAIL();
            Nan::Set(msg, Nan::New("ids").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        case 0x8805: {
            Nan::Set(msg, Nan::New("mediaId").ToLocalChecked(), Nan::New(Swap32(data->uploadMedia.mediaId)));
            Nan::Set(msg, Nan::New("del").ToLocalChecked(), Nan::New(data->uploadMedia.del == 1));
            return 0;
        }

        case 0x8804:
            Nan::Set(msg, Nan::New("stop").ToLocalChecked(), Nan::New(data->recording.cmd == 0));
            Nan::Set(msg, Nan::New("duration").ToLocalChecked(), Nan::New(Swap16(data->recording.duration)));
            Nan::Set(msg, Nan::New("upload").ToLocalChecked(), Nan::New(data->recording.store==0));
            Nan::Set(msg, Nan::New("frequency").ToLocalChecked(), Nan::New(data->recording.frequency));
            return 0;

        case 0x0900:
        case 0x8900: {
            ALIGING_ITEM(byte_val);
            if (!nextPackage) {
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->byte_val));
            }
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x0801: {
            ALIGING_ITEM(media);
            if (!nextPackage) {
                Nan::Set(msg, Nan::New("mediaId").ToLocalChecked(), Nan::New(Swap32(data->media.id)));
                Nan::Set(msg, Nan::New("type").ToLocalChecked(), Nan::New(data->media.type));
                Nan::Set(msg, Nan::New("format").ToLocalChecked(), Nan::New(data->media.format));
                Nan::Set(msg, Nan::New("code").ToLocalChecked(), Nan::New(data->media.code));
                Nan::Set(msg, Nan::New("channel").ToLocalChecked(), Nan::New(data->media.channel));
                setPositionData(msg, data->media, nullptr, 0);
            }
            
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x0901: {
            ALIGING_ITEM(dword_val);
            uint32_t total, parsed;
            if (!nextPackage) {
                total = Swap32(data->dword_val);
                parsed = 0;
                Nan::Set(msg, Nan::New("size").ToLocalChecked(), Nan::New(total));
            } else {
                total = getIntProp(msg, "size", 0xffffffff);
                parsed = getIntProp(msg, "_parsed"); 
            }
            
            rawDataSize = std::min(rawDataSize, (uint16_t)(total - parsed));
            Nan::Set(msg, Nan::New("data").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed + rawDataSize));
            return 0;
        }

        case 0x0a00:
        case 0x8a00: {
            ALIGING_ITEM(dword_val);
            Nan::Set(msg, Nan::New("e").ToLocalChecked(), Nan::New(Swap32(data->dword_val)));
            Nan::Set(msg, Nan::New("n").ToLocalChecked(), Nan::CopyBuffer(rawData, rawDataSize).ToLocalChecked());
            return 0;
        }

        case 0x8604: {
            uint16_t total, parsed;
            if (!nextPackage) {
                uint16_t prop = Swap16(data->setPoly.prop);
                if (prop & 0x01) {
                    if (prop & 0x02)
                        ALIGING_SIZE(sizeof(data->setPoly));
                    else
                        ALIGING_SIZE(sizeof(data->setPoly)-3);
                } else {
                    if (prop & 0x02)
                        ALIGING_SIZE(sizeof(data->setPoly)-12);
                    else
                        ALIGING_SIZE(sizeof(data->setPoly)-15);
                }

                parsed = 0;

                Nan::Set(msg, Nan::New("id").ToLocalChecked(), Nan::New(Swap32(data->setPoly.regionId)));
                Nan::Set(msg, Nan::New("prop").ToLocalChecked(), Nan::New(prop));
                if (prop & 0x01) {
                    if (prop & 0x02) {
                        Nan::Set(msg, Nan::New("start").ToLocalChecked(), decodeBcd6Date(data->setPoly.timespeed.start));
                        Nan::Set(msg, Nan::New("end").ToLocalChecked(), decodeBcd6Date(data->setPoly.timespeed.end));
                        Nan::Set(msg, Nan::New("speedLimit").ToLocalChecked(), Nan::New(Swap16(data->setPoly.timespeed.speedLimit)));
                        Nan::Set(msg, Nan::New("speedLimitTime").ToLocalChecked(), Nan::New(data->setPoly.timespeed.speedLimitTime));
                        total = Swap16(data->setPoly.timespeed.pointsCount);
                    } else {
                        Nan::Set(msg, Nan::New("start").ToLocalChecked(), decodeBcd6Date(data->setPoly.time.start));
                        Nan::Set(msg, Nan::New("end").ToLocalChecked(), decodeBcd6Date(data->setPoly.time.end));
                        total = Swap16(data->setPoly.time.pointsCount);
                    }
                } else {
                    if (prop & 0x02) {
                        Nan::Set(msg, Nan::New("speedLimit").ToLocalChecked(), Nan::New(Swap16(data->setPoly.speed.speedLimit)));
                        Nan::Set(msg, Nan::New("speedLimitTime").ToLocalChecked(), Nan::New(data->setPoly.speed.speedLimitTime));
                        total = Swap16(data->setPoly.speed.pointsCount);
                    } else {
                        total = Swap16(data->setPoly.nil.pointsCount);
                    }
                }
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xffff);
                parsed = getIntProp(msg, "_parsed"); 
            }

            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+8) <= pEnd && parsed < total) {
                uint32_t lat = PINT32(p);
                uint32_t lng = PINT32(p+4);
                p+=8;

                Local<Object> item = Nan::New<Object>();
                Nan::Set(item, Nan::New("lat").ToLocalChecked(), Nan::New(((double)lat)/1000000));
                Nan::Set(item, Nan::New("lng").ToLocalChecked(), Nan::New(((double)lng)/1000000));
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("points").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));

            return 0;
        }

        case 0x8606: {
            uint16_t total, parsed;
            if (!nextPackage) {
                uint16_t prop = Swap16(data->setRoute.prop);
                if (prop & 0x01) {
                    ALIGING_SIZE(sizeof(data->setRoute));
                } else {
                    ALIGING_SIZE(sizeof(data->setRoute) - 12);
                }

                parsed = 0;

                Nan::Set(msg, Nan::New("id").ToLocalChecked(), Nan::New(Swap32(data->setRoute.regionId)));
                Nan::Set(msg, Nan::New("prop").ToLocalChecked(), Nan::New(prop));
                if (prop & 0x01) {
                    Nan::Set(msg, Nan::New("start").ToLocalChecked(), decodeBcd6Date(data->setRoute.time.start));
                    Nan::Set(msg, Nan::New("end").ToLocalChecked(), decodeBcd6Date(data->setRoute.time.end));
                    total = Swap16(data->setRoute.time.pointsCount);
                } else {
                    total = Swap16(data->setRoute.ntime.pointsCount);
                }
                Nan::Set(msg, Nan::New("total").ToLocalChecked(), Nan::New(total));
            } else {
                PADDING_DATA();
                total = getIntProp(msg, "total", 0xffff);
                parsed = getIntProp(msg, "_parsed"); 
            }

            Local<Array> items = Nan::New<Array>();
            unsigned int itemsCount = 0;

            const uint8_t* p = (const uint8_t*)rawData;
            const uint8_t* pEnd = p + rawDataSize;

            while ((p+18) <= pEnd && parsed < total) {
                uint32_t id = PINT32(p);
                uint32_t secId = PINT32(p+4);
                uint32_t lat = PINT32(p+8);
                uint32_t lng = PINT32(p+12);
                uint8_t width = *(p+16);
                uint8_t prop = *(p+17);

                uint8_t addsize = 0;
                if (prop & 0x01) {
                    addsize += 4;
                }
                if (prop & 0x02) {
                    addsize += 3;
                }

                if ((p+18+addsize) > pEnd)
                    break;

                p += 18;

                Local<Object> item = Nan::New<Object>();
                Nan::Set(item, Nan::New("id").ToLocalChecked(), Nan::New(id));
                Nan::Set(item, Nan::New("secId").ToLocalChecked(), Nan::New(secId));
                Nan::Set(item, Nan::New("lat").ToLocalChecked(), Nan::New(((double)lat)/1000000));
                Nan::Set(item, Nan::New("lng").ToLocalChecked(), Nan::New(((double)lng)/1000000));
                Nan::Set(item, Nan::New("width").ToLocalChecked(), Nan::New(width));
                Nan::Set(item, Nan::New("prop").ToLocalChecked(), Nan::New(prop));

                if (prop & 0x01) {
                    Nan::Set(item, Nan::New("maxDrivingTime").ToLocalChecked(), Nan::New(PINT16(p)));
                    Nan::Set(item, Nan::New("minDrivingTime").ToLocalChecked(), Nan::New(PINT16(p+2)));
                    p += 4;
                }
                if (prop & 0x02) {
                    Nan::Set(item, Nan::New("speedLimit").ToLocalChecked(), Nan::New(PINT16(p)));
                    Nan::Set(item, Nan::New("speedLimitTime").ToLocalChecked(), Nan::New(*(p+2)));
                    p += 3;
                }
                Nan::Set(items, itemsCount++, item);
                parsed++;
            }
            SAVING_TAIL();

            Nan::Set(msg, Nan::New("points").ToLocalChecked(), items);
            Nan::Set(msg, Nan::New("_parsed").ToLocalChecked(), Nan::New(parsed));
            return 0;
        }

        default:
            return 0;
    }
}
