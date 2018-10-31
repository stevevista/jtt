#ifndef __NODE_WRAP_H__
#define __NODE_WRAP_H__

#include <nan.h>
#include "jt808_parser.h"
#include "jt809_parser.h"

using v8::Object;
using v8::Value;
using v8::Array;
using v8::Local;
using v8::Integer;
using v8::String;
using v8::Function;
using v8::FunctionTemplate;
using v8::Date;

class Parser : public Nan::ObjectWrap, public IHttpParserCallback, public IJT808ParserCallback, public IJT809ParserCallback {
public:
    static NAN_MODULE_INIT(Init);

private:
    explicit Parser(bool debug);
    void Initialize();


    static NAN_METHOD(New);
    static NAN_METHOD(Reinitialize);
    static NAN_METHOD(Close);
    static NAN_METHOD(Execute);
    static NAN_METHOD(Finish);
    static NAN_METHOD(SetDecRSA);
    static NAN_METHOD(Set809EncryptKeys);

    static NAN_METHOD(Packing);
    static NAN_METHOD(Packing809);

    Local<Value> Execute(const char* data, size_t len);

    virtual int onHttpMessageComplete();
    virtual int onHttpHeadersComplete(
                        unsigned short major, 
                        unsigned short minor,
                        const std::vector<std::string>& headers,
                        const char* method,
                        const std::string& url,
                        bool upgrade,
                        bool keepAlive);
    virtual int onHttpBody(const char *at, size_t length);

    virtual void onJt808ParseError(unsigned int err,
                    uint16_t msg_id,
                    uint16_t prop,
                    uint16_t sn,
                    uint16_t package_count,
                    uint16_t package_index,
                    const char* imei);
    virtual void onJt808Message(
                    uint16_t msg_id,
                    bool rsa,
                    uint16_t sn,
                    uint16_t package_count,
                    uint16_t package_index,
                    const char* imei,
                    pkg_content* data);

    virtual void onJt809ParseError(unsigned int err,
                    uint32_t msg_len,
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    uint32_t encrypt_key,
                    uint16_t crc,
                    uint16_t crcCal);
    virtual void onJt809Message(
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    const pkg_content1& info,
                    const char* data,
                    uint32_t data_size);

    size_t execute(const char *data, size_t len);

    bool got_exception_;
    Local<Object> current_buffer_;
    size_t current_buffer_len_;
    char* current_buffer_data_;

    HttpParser http;
    JT808Parser jt808;
    JT809Parser jt809;
    unsigned int state_;
};


#endif

