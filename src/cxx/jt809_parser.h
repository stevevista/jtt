#ifndef __JT809_PARSER_H__
#define __JT809_PARSER_H__

#include "http_parser.h"


struct ALIGNBYTE UP_CONNECT_REQ {
    uint32_t    userId;
    char        password[8];
    char        ip[32];
    uint16_t    port;
};

struct ALIGNBYTE UP_CONNECT_RSP {
    uint8_t     result;
    uint32_t    verifyCode;
};

struct ALIGNBYTE UP_DISCONNECT_REQ {
    uint32_t    userId;
    char        password[8];
};

struct ALIGNBYTE DOWN_TOTAL_RECV_BACK_MSG {
    uint32_t    total;
    uint64_t    start;
    uint64_t    end;
};

struct ALIGNBYTE VEHICLE_BASE_INFO {
    char        vehicleNo[21];
    uint8_t     color;
    uint16_t    dataType;
    uint32_t    dataLength;
};

struct ALIGNBYTE DATA_BASE_INFO {
    uint16_t    dataType;
    uint32_t    dataLength;
};


struct ALIGNBYTE VEHICLE_BYTE_DATA {
    VEHICLE_BASE_INFO _;
    uint8_t     byteVal;
};


struct ALIGNBYTE VEHICLE_CAR_INFO {
    VEHICLE_BASE_INFO _;
    char        carInfo[0];
};


struct ALIGNBYTE GNSS {
    uint8_t     encrypt;
    char        datetime[7];
    uint32_t    lng;
    uint32_t    lat;
    uint16_t    speed;
    uint16_t    bspeed;
    uint32_t    mileage;
    uint16_t    direction;
    uint16_t    altitude;
    uint32_t    status;
    uint32_t    alarms;
};

struct ALIGNBYTE UP_EXG_MSG_REGISTER {
    VEHICLE_BASE_INFO _;
    char        platformId[11];
    char        producerId[11];
    char        model[20];
    char        terminalId[7];
    char        simno[12];
};

struct ALIGNBYTE UP_EXG_MSG_REAL_LOCATION {
    VEHICLE_BASE_INFO _;
    GNSS        gnss;
};

struct ALIGNBYTE UP_EXG_MSG_HISTORY_LOCATION {
    VEHICLE_BASE_INFO _;
    uint8_t     gnssCount;
    GNSS        gnss[0];
};

struct ALIGNBYTE UP_EXG_MSG_APPLY_FOR_MONITOR_STARTUP {
    VEHICLE_BASE_INFO _;
    uint64_t    start;
    uint64_t    end;
};

struct ALIGNBYTE UP_EXG_MSG_REPORT_DRIVER_INFO_ACK {
    VEHICLE_BASE_INFO _;
    char        driverName[16];
    char        driverId[20];
    char        license[40];
    char        orgName[200];
};

struct ALIGNBYTE UP_EXG_MSG_TAKE_EWAYBILL_ACK {
    VEHICLE_BASE_INFO _;
    uint32_t    length;
};


struct ALIGNBYTE UP_PLATFORM_MSG_POST_QUERY_ACK {
    DATA_BASE_INFO _;
    uint8_t     objtype;
    char        objid[12];
    uint32_t    infoid;
    uint32_t    length;
    char        content[0];
};

struct ALIGNBYTE UP_PLATFORM_MSG_INFO_ACK {
    DATA_BASE_INFO _;
    uint32_t    infoid;
};

struct ALIGNBYTE UP_WARN_MSG_URGE_TODO_ACK {
    VEHICLE_BASE_INFO _;
    uint32_t    supervisionId;
    uint8_t     result;
};

struct ALIGNBYTE UP_WARN_MSG_ADPT_INFO {
    VEHICLE_BASE_INFO _;
    uint8_t     warnSrc;
    uint16_t    warnType;
    uint64_t    warnTime;
    uint32_t    infoId;
    uint32_t    infoLength;
    char        content[0];
};

struct ALIGNBYTE UP_WARN_MSG_ADPT_TODO_INFO {
    VEHICLE_BASE_INFO _;
    uint32_t    infoId;
    uint8_t     result;
};

struct ALIGNBYTE DOWN_WARN_MSG_URGE_TODO_REQ {
    VEHICLE_BASE_INFO _;
    uint8_t     warnSrc;
    uint16_t    warnType;
    uint64_t    warnTime;
    uint32_t    supervisionId;
    uint64_t    endTime;
    uint8_t     level;
    char        supervisor[16];
    char        phoneNumber[20];
    char        email[32];
};

struct ALIGNBYTE DOWN_WARN_MSG_EXG_INFORM {
    VEHICLE_BASE_INFO _;
    uint8_t     warnSrc;
    uint16_t    warnType;
    uint64_t    warnTime;
    uint32_t    length;
    char        content[0];
};


struct ALIGNBYTE UP_CTRL_MSG_TAKE_PHOTO_ACK {
    VEHICLE_BASE_INFO _;
    uint8_t     flag;
    GNSS        gnss;
    uint8_t     lensId;
    uint32_t    length;
    uint8_t     sizeType;
    uint8_t     format;
};

struct ALIGNBYTE UP_CTRL_MSG_TEXT_INFO_ACK {
    VEHICLE_BASE_INFO _;
    uint32_t    ackId;
    uint8_t     result;
};

struct ALIGNBYTE UP_CTRL_MSG_TAKE_TRAVEL_ACK {
    VEHICLE_BASE_INFO _;
    uint8_t     cmd;
    uint32_t    length;
    char        data[0];
};


struct ALIGNBYTE DOWN_CTRL_MSG_MONITOR_VEHICLE_REQ {
    VEHICLE_BASE_INFO _;
    char        phoneNumber[20];
};

struct ALIGNBYTE DOWN_CTRL_MSG_TAKE_PHOTO_REQ {
    VEHICLE_BASE_INFO _;
    uint8_t     lensId;
    uint8_t     size;
};

struct ALIGNBYTE DOWN_CTRL_MSG_TEXT_INFO {
    VEHICLE_BASE_INFO _;
    uint32_t    sequence;
    uint8_t     priority;
    uint32_t    length;
    char        content[0];
};

struct ALIGNBYTE DOWN_CTRL_MSG_EMERGENCY_MONITORING_REQ {
    VEHICLE_BASE_INFO _;
    char        authCode[10];
    char        apName[20];
    char        username[49];
    char        password[22];
    char        serverIp[32];
    uint16_t    tcpPort;
    uint16_t    udpPort;
    uint64_t    endTime;
};

struct pkg_content1 {

    union {

        uint8_t     byte_val;
        uint32_t    dword_val;

        VEHICLE_BASE_INFO                           base;
        DATA_BASE_INFO                              datainfo;
        VEHICLE_BYTE_DATA                           byteData;
        VEHICLE_CAR_INFO                            carInfo;

        UP_CONNECT_REQ                              connectReq;
        UP_CONNECT_RSP                              up_connect_rsp;
        UP_DISCONNECT_REQ                           up_disconnect_req;
        DOWN_TOTAL_RECV_BACK_MSG                    down_total_recv_back_msg;

        UP_EXG_MSG_REGISTER                         reg;
        UP_EXG_MSG_REAL_LOCATION                    real_location;
        UP_EXG_MSG_HISTORY_LOCATION                 multiLocation;
        UP_EXG_MSG_APPLY_FOR_MONITOR_STARTUP        startup;
        UP_EXG_MSG_REPORT_DRIVER_INFO_ACK           reportDriver;
        UP_EXG_MSG_TAKE_EWAYBILL_ACK        ewaybill;
        UP_PLATFORM_MSG_POST_QUERY_ACK      post_query;
        UP_PLATFORM_MSG_INFO_ACK    info_ack;
        UP_WARN_MSG_URGE_TODO_ACK   urge_todo;
        UP_WARN_MSG_ADPT_INFO       adpt_info;
        UP_WARN_MSG_ADPT_TODO_INFO  adpt_todo;


        DOWN_WARN_MSG_URGE_TODO_REQ                 warnUrgeTodoReq;
        DOWN_WARN_MSG_EXG_INFORM                    warnInform;
        UP_CTRL_MSG_TAKE_PHOTO_ACK                  takePhotoAck;
        UP_CTRL_MSG_TEXT_INFO_ACK                   textInfoAck;
        UP_CTRL_MSG_TAKE_TRAVEL_ACK                 takeTravelAck;
        DOWN_CTRL_MSG_MONITOR_VEHICLE_REQ           monitorVehicleReq;
        DOWN_CTRL_MSG_TAKE_PHOTO_REQ                takePhotoReq;
        DOWN_CTRL_MSG_TEXT_INFO                     textInfo;
        DOWN_CTRL_MSG_EMERGENCY_MONITORING_REQ      emergency_monitor_req;

        char buffer[0x1000];
    };

    uint32_t    received;
};



class IJT809ParserCallback {
public:
    virtual ~IJT809ParserCallback() {}
    virtual void onJt809ParseError(unsigned int err,
                    uint32_t msg_len,
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    uint32_t encrypt_key,
                    uint16_t crc,
                    uint16_t crcCal) = 0;
    virtual void onJt809Message(
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    const pkg_content1& info,
                    const char* data,
                    uint32_t data_size) = 0;
};

class JT809Parser {
public:
    ~JT809Parser();

protected:
    friend class Parser;

    JT809Parser(bool debug);
    void init();

    // 0 parsed 1 in parsing 2 no 0xfe found 3 error 
    size_t execute(IJT809ParserCallback* callback, const char *data, size_t len);

    void cleanDynamic();

    uint32_t M1; // not zero
    uint32_t IA1;
    uint32_t IC1;

private:
    bool convert_5b_char_;
    bool convert_5d_char_;
    uint16_t crcCal_;
    uint16_t crc_;
    uint32_t parsed_len_;

    uint32_t msg_len_;
    uint32_t sn_;

    uint16_t msg_id_;

    uint32_t center_id_;
    uint8_t version_[3];
    uint8_t encrypt_;
    uint32_t encrypt_key_;
    pkg_content1 info_;


    uint32_t contentSize_;
    char* dataLengthPtr_;
    uint32_t dataLength_;
    char* dataBuffer_;
    uint32_t dataBufferIndex_;

    unsigned int http_errno_;
    const bool debugMode_;
};



#endif
