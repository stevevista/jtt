#ifndef __JT808_PARSER_H__
#define __JT808_PARSER_H__

#include "types.h"
#include <vector>
#include <string>
#include <openssl/rsa.h>


/* Map for errno-related constants
 *
 * The provided argument should be a macro that takes 2 arguments.
 */
#define HTTP_ERRNO_MAP(XX)                                           \
  /* No error */                                                     \
  XX(OK, "success")                                                  \
  XX(INVALID_EOF_STATE, "stream ended at an unexpected time")        \
  XX(INVALID_VERSION, "invalid HTTP version")                        \
  XX(INVALID_HEADER_TOKEN, "invalid character in header")            \
  XX(INVALID_CHUNK_SIZE,                                             \
     "invalid character in chunk size header")                       \
  XX(INVALID_CONSTANT, "invalid constant string")                    \
  XX(INVALID_INTERNAL_STATE, "encountered unexpected internal state")\
  XX(STRICT, "strict mode assertion failed")                         \
  XX(BAD_CONVERT_CODE, "0x7d expect 0x01 or 0x02")                   \
  XX(UNEXPECT_MAGIC, "unexpected 0x7e in message")                   \
  XX(CHECKSUM_ERROR, "checksum error")                               \
  XX(DECRYPT_RSA_FAIL, "rsa error")                                  \
  XX(UNKNOWN, "an unknown error occurred")


/* Define HPE_* values for each errno value above */
#define HTTP_ERRNO_GEN(n, s) HPE_##n,
enum http_errno {
  HTTP_ERRNO_MAP(HTTP_ERRNO_GEN)
};
#undef HTTP_ERRNO_GEN


/* Return a string name of the given error */
const char *http_errno_name(enum http_errno err);

// 0x0001, 0x8001
struct ALIGNBYTE GENERAL_ACK {
    uint16_t    ackSN;
    uint16_t    ackId;
    uint8_t     result;
};


// 0x0104
struct ALIGNBYTE PARAMS_ACK {
    uint16_t    ackSN;
    uint8_t     count;
};


// 0x0108
struct ALIGNBYTE UPGRADE_ACK {
    uint8_t     upgradeType;
    uint8_t     result;
};

// 0x8601, 0x8603, 0x8605, 0x8607
struct ALIGNBYTE SET_IDS32 {
    uint8_t         count;
    uint32_t        ids[255];
};

// 0x8600, 0x8602
struct ALIGNBYTE SET_REGION {
    uint8_t         prop;
    uint8_t         count;
};

// 0x8604, 0x8606

struct ALIGNBYTE POLYGON_PT {
    uint32_t    lat;
    uint32_t    lng;
};

struct ALIGNBYTE SET_POLY {
    uint32_t        regionId;
    uint16_t        prop;
    union {
        struct ALIGNBYTE {
            char            start[6];
            char            end[6];
            uint16_t        speedLimit;
            uint8_t         speedLimitTime;
            uint16_t        pointsCount;
        } timespeed;
        struct ALIGNBYTE {
            char            start[6];
            char            end[6];
            uint16_t        pointsCount;
        } time;
        struct ALIGNBYTE {
            uint16_t        speedLimit;
            uint8_t         speedLimitTime;
            uint16_t        pointsCount;
        } speed;
        struct ALIGNBYTE {
            uint16_t        pointsCount;
        } nil;
    };
};

struct ALIGNBYTE SET_ROUTE {
    uint32_t        regionId;
    uint16_t        prop;
    union {
        struct ALIGNBYTE {
            char            start[6];
            char            end[6];
            uint16_t        pointsCount;
        } time;
        struct ALIGNBYTE {
            uint16_t        pointsCount;
        } ntime;
    };
};


// 0x8202
struct ALIGNBYTE TRACK_REQ {
    uint16_t        interval;
    uint32_t        duration;
};

// 0x8203
struct ALIGNBYTE CONFIRM_ALARM {
    uint16_t        ackSN;
    uint32_t        alarmType;
};

// 0x8301
struct ALIGNBYTE SET_EVENT {
    uint8_t         type;
    uint8_t         count;
};

// 0x8304
struct ALIGNBYTE INFO_SERV {
    uint8_t         type;
    uint16_t        contentLength;
    char            content[1020];
};


// 0x8401
struct ALIGNBYTE PHONEBOOK {
    uint8_t         type;
    uint8_t         count;
};

struct ALIGNBYTE UPLOAD_MEDIA_EX {
    uint8_t         type;
    uint8_t         channel;
    uint8_t         code;
    char            start[6];
    char            end[6];
    uint8_t         del;
};

// 0x8805
struct ALIGNBYTE UPLOAD_MEDIA {
    uint32_t        mediaId;
    uint8_t         del;
};

// 0x0700
struct ALIGNBYTE VEHICLE_RECORD {
    uint16_t        ackSN;
    uint8_t         cmd;
};

// 0x8804
struct ALIGNBYTE RECORDING {
    uint8_t     cmd;
    uint16_t    duration;
    uint8_t     store;
    uint8_t     frequency;
};

// 0x8801
struct ALIGNBYTE SHOTTING {
    uint8_t     channel;
    uint16_t    cmd;
    uint16_t    duration;
    uint8_t     store;
    uint8_t     resolution;
    uint8_t     quality;
    uint8_t     brightness;
    uint8_t     contrast;
    uint8_t     saturation;
    uint8_t     chroma;
};

struct ALIGNBYTE LOCATION {
    uint32_t alarms;
    uint32_t status;
    uint32_t lat;
    uint32_t lng;
    uint16_t altitude;
    uint16_t speed;
    uint16_t direction;
    char     time[6];
};

struct ALIGNBYTE LOCATION_ACK {
    uint16_t ackSN;
    uint32_t alarms;
    uint32_t status;
    uint32_t lat;
    uint32_t lng;
    uint16_t altitude;
    uint16_t speed;
    uint16_t direction;
    char     time[6];
};

// 0x0704
struct ALIGNBYTE BULK_LOCATION {
    uint16_t count;
    uint8_t  type;
};

// 0x0705
struct ALIGNBYTE CAN_UPLOAD {
    uint16_t    count;
    char        time[5];
};

// 0x0800
struct ALIGNBYTE MEDIA_INFO {
    uint32_t    id;
    uint8_t     type;
    uint8_t     format;
    uint8_t     code;
    uint8_t     channel;
};

// 0x0801
struct ALIGNBYTE MEDIA_UP {
    uint32_t    id;
    uint8_t     type;
    uint8_t     format;
    uint8_t     code;
    uint8_t     channel;
    uint32_t    alarms;
    uint32_t    status;
    uint32_t    lat;
    uint32_t    lng;
    uint16_t    altitude;
    uint16_t    speed;
    uint16_t    direction;
    char        time[6];
};

// 0x8800
struct ALIGNBYTE MEDIA_ACK {
    uint32_t    mediaId;
    uint8_t     count;
    uint16_t    ids[255];
};

// 0x0802
struct ALIGNBYTE MEDIA_QUERY_ACK {
    uint16_t    ackSN;
    uint16_t    count;
};

// 0x0805
struct ALIGNBYTE SHOT_ACK {
    uint16_t ackSN;
    uint8_t result;
    uint16_t count;
};


// 0x8303
struct ALIGNBYTE IOD_MENU {
    uint8_t         type;
    uint8_t         count;
};

// 0x0303
struct ALIGNBYTE IOD {
    uint8_t         type;
    uint8_t         flag;
};


// 0x8302
struct ALIGNBYTE QUESTION {
    uint8_t         flag;
    uint8_t         titleLength;
    char            title[255];
};


// 0x0302
struct ALIGNBYTE ANSWER {
    uint16_t        ackSN;
    uint8_t         answer;
};


// 0x8108
struct ALIGNBYTE UPGRADE {
    uint8_t     upgradeType;
    char        manufactor[5];
    uint8_t     versionLength;
    char        version[259];
};

// 0x0702
struct ALIGNBYTE DRIVER_REPORT {
    uint8_t     status;
    char        time[6];
};

// 0x0107
struct ALIGNBYTE PROPERTY_ACK {
    uint16_t    prop;
    char        manufactor[5];
    char        model[20];
    char        terminalId[7];
    uint8_t     iccid[10];
};


// 0x8100
struct ALIGNBYTE REGISTER_ACK {
    uint16_t    ackSN;
    uint8_t     result;
};


// 0x8003
struct ALIGNBYTE RESEND_REQ {
    uint16_t    ackSN;
    uint8_t     count;
    uint16_t    ids[255];
};



// 0x0100
struct ALIGNBYTE REGISTER {
    uint16_t    province;
    uint16_t    city;
    char        manufactor[5];
    char        model[20];
    char        terminalId[7];
    uint8_t     color;
    char        plateNo[128];
};


struct pkg_content {

    char __padding[128];

    union  {
        GENERAL_ACK     ack;
        LOCATION        loc;
        LOCATION_ACK    locAck;
        BULK_LOCATION   bulkLoc;
        PARAMS_ACK      paramsAck;
        UPGRADE         upgrade;
        UPGRADE_ACK     upgradeAck;
        SET_IDS32       setIds32;
        TRACK_REQ       track;
        CONFIRM_ALARM   confirmAlarm;
        SET_EVENT       setEvent;
        INFO_SERV       info;
        PHONEBOOK       phonebook;
        SET_REGION      setRegion;
        SET_POLY        setPoly;
        SET_ROUTE       setRoute;
        UPLOAD_MEDIA_EX uploadMediaEx;
        UPLOAD_MEDIA    uploadMedia;
        MEDIA_ACK       mediaAck;
        MEDIA_UP        media;
        MEDIA_INFO      mediaInfo;
        MEDIA_QUERY_ACK mediaQueryAck;
        SHOTTING        shotting;
        SHOT_ACK        shotAck;
        RECORDING       recording;
        VEHICLE_RECORD  vehicleRecord;
        CAN_UPLOAD      canUpload;
        IOD_MENU        iodSet;
        IOD             iod;
        QUESTION        question;
        ANSWER          answer;
        DRIVER_REPORT   driver;
        PROPERTY_ACK    propAck;
        REGISTER_ACK    regAck;
        RESEND_REQ      resend;
        REGISTER        reg;
        
        uint8_t         byte_val;
        uint32_t        dword_val;

        char buffer[1024];
    };

    uint16_t        received;

};


#endif
