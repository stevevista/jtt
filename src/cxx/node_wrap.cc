
#include "node_wrap.h"
#include "utils.h"
#include "node_808.h"

const uint32_t kOn808Message = 4;
const uint32_t kOn808MessagePrev = 5;
const uint32_t kOnParserError = 7;

Parser::Parser(bool debug)
:rsa_(nullptr) {
    Initialize();
}

Parser::~Parser() {
    if (rsa_) {
        RSA_free(rsa_);
        rsa_ = nullptr;
    }
}

void Parser::Initialize() {
    errCode_ = HPE_OK;
    memset(&info_, 0, sizeof(info_));
    parsedLength_ = 0;
    got_exception_ = false;
}


NAN_MODULE_INIT(Parser::Init) {

    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("ComplexParser").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    tpl->Set(Nan::New("kOn808Message").ToLocalChecked(), Nan::New(kOn808Message));
    tpl->Set(Nan::New("kOn808MessagePrev").ToLocalChecked(), Nan::New(kOn808MessagePrev));
    tpl->Set(Nan::New("kOnParserError").ToLocalChecked(), Nan::New(kOnParserError));

    Nan::SetMethod(tpl, "packing", Packing);

    Nan::SetPrototypeMethod(tpl, "reinitialize", Reinitialize);
    Nan::SetPrototypeMethod(tpl, "close", Close);
    Nan::SetPrototypeMethod(tpl, "execute", Execute);
    Nan::SetPrototypeMethod(tpl, "finish", Finish);
    Nan::SetPrototypeMethod(tpl, "setDecRSA", SetDecRSA); 

    Nan::Set(target, Nan::New("ComplexParser").ToLocalChecked(), Nan::GetFunction(tpl).ToLocalChecked());
}



NAN_METHOD(Parser::New) {
    bool debug = info[0]->IsUndefined() ? false : Nan::To<bool>(info[0]).FromJust();
    Parser *obj = new Parser(debug);
    obj->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Parser::Reinitialize) {
  Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());
  obj->Initialize();
}


NAN_METHOD(Parser::Execute) {

    Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());
    Local<Object> buffer_obj = info[0].As<Object>();
    char* buffer_data = node::Buffer::Data(buffer_obj);
    size_t buffer_len = node::Buffer::Length(buffer_obj);

    obj->Execute(buffer_data, buffer_len);
}

void Parser::Execute(const char* data, size_t len) {
    Nan::EscapableHandleScope scope;

    current_buffer_len_ = len;
    current_buffer_data_ = (char*)data;
    got_exception_ = false;

    execute(data, len);

    // Unassign the 'buffer_' variable
    current_buffer_.Clear();
    current_buffer_len_ = 0;
    current_buffer_data_ = nullptr;
}

NAN_METHOD(Parser::Finish) {

    Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());

    assert(obj->current_buffer_.IsEmpty());
    obj->got_exception_ = false;

    obj->execute(nullptr, 0);
}

NAN_METHOD(Parser::SetDecRSA) {
    if (info.Length() < 3) {
        return;
    }

    Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());

    uint32_t e = info[0]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[0]).FromJust();
    
    Local<Object> n_obj = info[1].As<Object>();
    uint8_t* n = (uint8_t*)node::Buffer::Data(n_obj);
    size_t n_size = node::Buffer::Length(n_obj);

    Local<Object> d_obj = info[2].As<Object>();
    uint8_t* d = (uint8_t*)node::Buffer::Data(d_obj);
    size_t d_size = node::Buffer::Length(d_obj);

    obj->setDecRSA(e, n, (uint16_t)n_size, d, (uint16_t)d_size);
}

NAN_METHOD(Parser::Close) {
}

#define PARSE_ERROR(e)                                               \
do {                                                                 \
  errCode_ = (e);                                                 \
  goto errorrecover;                                                 \
} while(0)

void Parser::setDecRSA(uint32_t e, uint8_t* n, uint16_t n_size, uint8_t* d, uint16_t d_size) {
    if (rsa_) {
        RSA_free(rsa_);
        rsa_ = nullptr;
    }
    rsa_ = RSA_new();
    BIGNUM  *bne = BN_new();  
    BN_set_word(bne, e);
    rsa_->d = BN_bin2bn(d, d_size, NULL);
    rsa_->n = BN_bin2bn(n, n_size, NULL);
    rsa_->e = bne;
}

void Parser::execute(const char *data, const size_t len) {

    for (const char *p=data; p != data + len; p++) {
errorrecover:
        // try to recover from error, skip all characters until 0x7e
        if (errCode_ != HPE_OK) {
            IMEI_[12] = 0;
            onJt808ParseError(
                        errCode_,
                        messageId_,
                        messageProp_,
                        serialNo_,
                        packagesCount_,
                        packageIndex_,
                        IMEI_);

            errCode_ = 0;
            parsedLength_ = 0;
        }

        // finding 0x7e
        if (parsedLength_ == 0) {
            for (; p != data + len && *p != 0x7e; p++) ;
            if (p == (data + len))
                return;

            parsedLength_ = 1;

            calcChecksum_ = 0;
            convertMode_ = false;
            headerSize_ = 12;
            IMEI_[12] = 0;
            packagesCount_ = 0;
            packageIndex_ = 0;
            info_.received = 0;
            rsaIndex_ = 0;
        }

        // skipping 0x7e
        if (parsedLength_ == 1 && !convertMode_) {
            for (; p != data + len && *p == 0x7e; p++) ;
            if (p == (data + len))
                return;
        }

        unsigned char ch = *p;

        // converting character
        if(convertMode_) {
            convertMode_ = false;
            if (ch == 0x01)
                ch = 0x7d;
            else if (ch == 0x02)
                ch = 0x7e;
            else 
                PARSE_ERROR(HPE_BAD_CONVERT_CODE);
        } else {
            if (ch == 0x7d) {
                convertMode_ = true;
                continue;
            }
        }

        calcChecksum_ ^= ch;
        parsedLength_++;

        if (parsedLength_ < headerSize_ + 2) {
            switch(parsedLength_) {
                case 2:
                    messageId_ = ((uint16_t)ch) << 8;
                    break;
                case 3:
                    messageId_ |= ch;
                    break;
                case 4:
                    messageProp_ = ((uint16_t)ch) << 8;
                    break;
                case 5:
                    messageProp_ |= ch;
                    contentLength_ = messageProp_ & 0x03ff;
                    contentEncrypted_ = !!(messageProp_ & 0x0400);

                    if (contentEncrypted_ && !rsa_) {
                        PARSE_ERROR(HPE_DECRYPT_RSA_FAIL);
                    }

                    if (messageProp_ & 0x2000)
                        headerSize_ = 16;
                    break;
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11: {
                    uint16_t index = parsedLength_ - 6;
                    IMEI_[index*2] = (ch>>4) + '0';
                    IMEI_[index*2+1] = (ch&0xf) + '0';
                    break;
                }
                case 12:
                    serialNo_ = ((uint16_t)ch) << 8;
                    break;
                case 13:
                    serialNo_ |= ch;
                    break;
                case 14:
                    packagesCount_ = ((uint16_t)ch) << 8;
                    break;
                case 15:
                    packagesCount_ |= ch;
                    break;
                case 16:
                    packageIndex_ = ((uint16_t)ch) << 8;
                    break;
                case 17:
                    packageIndex_ |= ch;
                    break;
            }

            continue;
        }

        if (parsedLength_ == headerSize_ + contentLength_ + 2) {

            if (calcChecksum_ != 0) {
                PARSE_ERROR(HPE_CHECKSUM_ERROR);
            }

            onJt808Message(
                        messageId_,
                        contentEncrypted_,
                        serialNo_,
                        packagesCount_,
                        packageIndex_,
                        IMEI_,
                        &info_);

            parsedLength_ = 0;
            continue;
        }

        if (contentEncrypted_) {
            rsaBlock_[rsaIndex_++] = ch;
            if (rsaIndex_ == sizeof(rsaBlock_) ||
                parsedLength_ == headerSize_ + contentLength_ + 1) {
                int r = RSA_private_decrypt(rsaIndex_, (uint8_t*)rsaBlock_, (uint8_t*)&info_.buffer[info_.received], rsa_,  RSA_PKCS1_PADDING);
                if (r < 0) {
                    PARSE_ERROR(HPE_DECRYPT_RSA_FAIL);
                }
                info_.received += r;
                rsaIndex_ = 0;
            }
        } else {
            info_.buffer[info_.received++] = ch;
        }
    }
}


void Parser::onJt808ParseError(unsigned int err,
                    uint16_t msg_id,
                    uint16_t prop,
                    uint16_t sn,
                    uint16_t package_count,
                    uint16_t package_index,
                    const char* imei) {

    Nan::HandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOnParserError);

    if (!cb->IsFunction())
        return;

    Local<Value> e = Nan::Error("Parse Error");
    Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
    eobj->Set(Nan::New("code").ToLocalChecked(), Nan::New(http_errno_name((enum http_errno)err)).ToLocalChecked());

    Local<Object> ctx = Nan::New<Object>();
    Nan::Set(ctx, Nan::New("messageId").ToLocalChecked(), Nan::New(msg_id));
    Nan::Set(ctx, Nan::New("prop").ToLocalChecked(), Nan::New(prop));
    Nan::Set(ctx, Nan::New("SN").ToLocalChecked(), Nan::New(sn));
    Nan::Set(ctx, Nan::New("_packagesCount").ToLocalChecked(), Nan::New(package_count));
    Nan::Set(ctx, Nan::New("_packageIndex").ToLocalChecked(), Nan::New(package_index)); 
    Nan::Set(ctx, Nan::New("imei").ToLocalChecked(), Nan::New(imei).ToLocalChecked());

    eobj->Set(Nan::New("jt808context").ToLocalChecked(), ctx);

    Local<Value> argv[1] = {eobj};
    // Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
    cb.As<Function>()->Call(obj, (int)arraysize(argv), argv);
}

void Parser::onJt808Message(
                    uint16_t msg_id,
                    bool rsa,
                    uint16_t sn,
                    uint16_t package_count,
                    uint16_t package_index,
                    const char* imei,
                    pkg_content* data) {

    Nan::HandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOn808Message);

    if (!cb->IsFunction())
        return;

    Local<Object> pkg = Nan::New<Object>();
    Nan::Set(pkg, Nan::New("messageId").ToLocalChecked(), Nan::New(msg_id));
    Nan::Set(pkg, Nan::New("_encrypted").ToLocalChecked(), Nan::New(rsa));
    Nan::Set(pkg, Nan::New("SN").ToLocalChecked(), Nan::New(sn));
    
    if (package_count) {
        Nan::Set(pkg, Nan::New("_packagesCount").ToLocalChecked(), Nan::New(package_count));
        Nan::Set(pkg, Nan::New("_packageIndex").ToLocalChecked(), Nan::New(package_index));
    }
    
    Nan::Set(pkg, Nan::New("imei").ToLocalChecked(), Nan::New(imei).ToLocalChecked());

    if (package_count && package_index > 1) {

        Local<Value> cbPrev = obj->Get(kOn808MessagePrev);
        if (cbPrev->IsFunction()) {
            Local<Value> argv[1] = {pkg};
            // Local<Value> r = Nan::MakeCallback(obj, cbPrev.As<Function>(), (int)arraysize(argv), argv);
            Local<Value> r = cbPrev.As<Function>()->Call(obj, (int)arraysize(argv), argv);

            if (r->IsObject()) {
                pkg = r.As<Object>();
                Nan::Set(pkg, Nan::New("SN").ToLocalChecked(), Nan::New(sn));
                Nan::Set(pkg, Nan::New("_packageIndex").ToLocalChecked(), Nan::New(package_index));
            } else {
                return;
            }
        }
    }

    bundlePackage(pkg, msg_id, package_count, package_index, data);
    
    Local<Value> argv[1] = {pkg};

    Local<Value> r =
        // Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
        cb.As<Function>()->Call(obj, (int)arraysize(argv), argv);

    if (r.IsEmpty()) {
      got_exception_ = true;
    }
}

/*

pack808(
    msgid,
    sn,
    imei,
    pkgcount,
    pkgsn,
    content,
    e,
    n
);

*/


NAN_MODULE_INIT(InitAll) {
    Parser::Init(target);
}


NODE_MODULE(complex_parser, InitAll)

