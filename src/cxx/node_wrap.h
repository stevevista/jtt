#ifndef __NODE_WRAP_H__
#define __NODE_WRAP_H__

#include <nan.h>
#include "jt808_parser.h"

using v8::Object;
using v8::Value;
using v8::Array;
using v8::Local;
using v8::Integer;
using v8::String;
using v8::Function;
using v8::FunctionTemplate;
using v8::Date;

class Parser : public Nan::ObjectWrap, public IJT808ParserCallback {
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

    static NAN_METHOD(Packing);

    Local<Value> Execute(const char* data, size_t len);

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

    size_t execute(const char *data, size_t len);

    bool got_exception_;
    Local<Object> current_buffer_;
    size_t current_buffer_len_;
    char* current_buffer_data_;

    JT808Parser jt808;
};


#endif

