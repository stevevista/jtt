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

class Parser : public Nan::ObjectWrap {
public:
    static NAN_MODULE_INIT(Init);
    ~Parser();

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

    void Execute(const char* data, size_t len);

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

    void setDecRSA(uint32_t e, uint8_t* n, uint16_t n_size, uint8_t* d, uint16_t d_size);
    void execute(const char *data, const size_t len);

    bool got_exception_;
    Local<Object> current_buffer_;
    size_t current_buffer_len_;
    char* current_buffer_data_;

private:
    unsigned int errCode_;

    pkg_content info_;

    char        rsaBlock_[128];
    uint8_t     rsaIndex_;

    uint16_t    parsedLength_;
    uint16_t    headerSize_;
    uint16_t    contentLength_;
    uint8_t     calcChecksum_;
    bool        contentEncrypted_;
    bool        convertMode_;

    uint16_t    messageId_;
    uint16_t    messageProp_;
    uint16_t    serialNo_;
    char        IMEI_[13];
    uint16_t    packagesCount_;
    uint16_t    packageIndex_;

    RSA* rsa_;
};


#endif

