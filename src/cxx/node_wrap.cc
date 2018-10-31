
#include "node_wrap.h"
#include "utils.h"
#include "node_808.h"


const uint32_t kOnProtocol = 0;
const uint32_t kOnHeadersComplete = 1;
const uint32_t kOnBody = 2;
const uint32_t kOnMessageComplete = 3;

const uint32_t kOn808Message = 4;
const uint32_t kOn808MessagePrev = 5;
const uint32_t kOn809Message = 6;
const uint32_t kOnParserError = 7;

enum state {
    s_unknown,
    s_http,
    s_maybe808,
    s_jt808,
    s_jt809
};

Parser::Parser(bool debug)
:jt808(debug)
,jt809(debug) {
    Initialize();
}

void Parser::Initialize() {
    state_ = s_unknown;
    http.init();
    jt808.init();
    jt809.init();
    got_exception_ = false;
}


NAN_MODULE_INIT(Parser::Init) {

    Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("ComplexParser").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    tpl->Set(Nan::New("kOnProtocol").ToLocalChecked(), Nan::New(kOnProtocol));
    tpl->Set(Nan::New("kOnHeadersComplete").ToLocalChecked(), Nan::New(kOnHeadersComplete));
    tpl->Set(Nan::New("kOnBody").ToLocalChecked(), Nan::New(kOnBody));
    tpl->Set(Nan::New("kOnMessageComplete").ToLocalChecked(), Nan::New(kOnMessageComplete));

    tpl->Set(Nan::New("kOn808Message").ToLocalChecked(), Nan::New(kOn808Message));
    tpl->Set(Nan::New("kOn808MessagePrev").ToLocalChecked(), Nan::New(kOn808MessagePrev));
    tpl->Set(Nan::New("kOn809Message").ToLocalChecked(), Nan::New(kOn809Message));
    tpl->Set(Nan::New("kOnParserError").ToLocalChecked(), Nan::New(kOnParserError));

    //tpl->Set(Nan::New("packing").ToLocalChecked(), Nan::GetFunction(Nan::New<FunctionTemplate>(Packing)).ToLocalChecked());

    Nan::SetMethod(tpl, "packing", Packing);
    Nan::SetMethod(tpl, "packing809", Packing809);

    Nan::SetPrototypeMethod(tpl, "reinitialize", Reinitialize);
    Nan::SetPrototypeMethod(tpl, "close", Close);
    Nan::SetPrototypeMethod(tpl, "execute", Execute);
    Nan::SetPrototypeMethod(tpl, "finish", Finish);
    Nan::SetPrototypeMethod(tpl, "setDecRSA", SetDecRSA); 
    Nan::SetPrototypeMethod(tpl, "set809EncryptKeys", Set809EncryptKeys); 

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

    Local<Value> ret = obj->Execute(buffer_data, buffer_len);

    if (!ret.IsEmpty())
        info.GetReturnValue().Set(ret);
}

Local<Value> Parser::Execute(const char* data, size_t len) {
    Nan::EscapableHandleScope scope;

    current_buffer_len_ = len;
    current_buffer_data_ = (char*)data;
    got_exception_ = false;

    size_t nparsed = execute(data, len);

    // Unassign the 'buffer_' variable
    current_buffer_.Clear();
    current_buffer_len_ = 0;
    current_buffer_data_ = nullptr;

    // If there was an exception in one of the callbacks
    if (got_exception_)
        return scope.Escape(Local<Value>());

    Local<Integer> nparsed_obj = Nan::New((uint32_t)nparsed);
    // If there was a parse error in one of the callbacks
    // TODO(bnoordhuis) What if there is an error on EOF?
    if (nparsed != len) {
        enum http_errno err = http.error();
        Local<Value> e = Nan::Error("Parse Error");
        Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
        eobj->Set(Nan::New("bytesParsed").ToLocalChecked(), Nan::New((uint32_t)nparsed));
        eobj->Set(Nan::New("code").ToLocalChecked(), Nan::New(http_errno_name(err)).ToLocalChecked());

        return scope.Escape(e);
    }
    return scope.Escape(nparsed_obj);
}

NAN_METHOD(Parser::Finish) {

    Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());

    assert(obj->current_buffer_.IsEmpty());
    obj->got_exception_ = false;

    size_t rv = obj->execute(nullptr, 0);

    if (obj->got_exception_)
      return;

    if (rv != 0) {
        enum http_errno err = obj->http.error();
        Local<Value> e = Nan::Error("Parse Error");
        Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
        eobj->Set(Nan::New("bytesParsed").ToLocalChecked(), Nan::New((uint32_t)0));
        eobj->Set(Nan::New("code").ToLocalChecked(), Nan::New(http_errno_name(err)).ToLocalChecked());
        info.GetReturnValue().Set(e);
    }
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

    obj->jt808.setDecRSA(e, n, (uint16_t)n_size, d, (uint16_t)d_size);
}

NAN_METHOD(Parser::Set809EncryptKeys) {
    if (info.Length() < 3) {
        return;
    }

    Parser* obj = Nan::ObjectWrap::Unwrap<Parser>(info.This());

    uint32_t m1 = info[0]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[0]).FromJust();
    uint32_t ia1 = info[1]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[1]).FromJust();
    uint32_t ic1 = info[2]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[2]).FromJust();

    obj->jt809.M1 = m1;
    obj->jt809.IA1 = ia1;
    obj->jt809.IC1 = ic1;  
}



NAN_METHOD(Parser::Close) {
}

int Parser::onHttpMessageComplete() {
    Nan::HandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOnMessageComplete);

    if (!cb->IsFunction())
        return 0;

    Local<Value> r = Nan::MakeCallback(obj, cb.As<Function>(), 0, nullptr);

    if (r.IsEmpty()) {
      got_exception_ = true;
      return -1;
    }

    return 0;
}

int Parser::onHttpBody(const char *at, size_t length) {
    Nan::EscapableHandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOnBody);

    if (!cb->IsFunction())
        return 0;

    // We came from consumed stream
    if (current_buffer_.IsEmpty()) {
        // Make sure Buffer will be in parent HandleScope
        current_buffer_ = scope.Escape(Nan::CopyBuffer(
          current_buffer_data_,
          (uint32_t)current_buffer_len_).ToLocalChecked());
    }

    Local<Value> argv[3] = {
      current_buffer_,
      Nan::New((uint32_t)(at - current_buffer_data_)),
      Nan::New((uint32_t)length)
    };

    Local<Value> r =
        Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);

    if (r.IsEmpty()) {
      got_exception_ = true;
      return -1;
    }

    return 0;
}

int Parser::onHttpHeadersComplete(
                unsigned short major, 
                unsigned short minor, 
                const std::vector<std::string>& hdrs,
                const char* method,
                const std::string& url,
                bool upgrade,
                bool keepAlive) {

    Nan::HandleScope scope;

    // Arguments for the on-headers-complete javascript callback. This
    // list needs to be kept in sync with the actual argument list for
    // `parserOnHeadersComplete` in lib/_http_common.js.
    enum on_headers_complete_arg_index {
      A_VERSION_MAJOR = 0,
      A_VERSION_MINOR,
      A_HEADERS,
      A_METHOD,
      A_URL,
      A_UPGRADE,
      A_SHOULD_KEEP_ALIVE,
      A_MAX
    };

    Local<Value> argv[A_MAX];
    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOnHeadersComplete);

    if (!cb->IsFunction())
        return 0;

    Local<Value> undefined = Nan::Undefined();
    for (size_t i = 0; i < arraysize(argv); i++)
        argv[i] = undefined;

    // Fast case, pass headers and URL to JS land.
    Local<Array> headers = Nan::New<Array>((uint32_t)hdrs.size());
    for (unsigned int i=0; i<hdrs.size(); i++) {
        Nan::Set(headers, i, Nan::New(hdrs[i]).ToLocalChecked());
    }

    argv[A_HEADERS] = headers;
    argv[A_URL] = Nan::New(url).ToLocalChecked();

    // METHOD
    argv[A_METHOD] = Nan::New(method).ToLocalChecked();

    // VERSION
    argv[A_VERSION_MAJOR] = Nan::New(major);
    argv[A_VERSION_MINOR] = Nan::New(minor);

    argv[A_SHOULD_KEEP_ALIVE] = Nan::New(keepAlive);
    argv[A_UPGRADE] = Nan::New(upgrade);

    Local<Value> head_response =
        Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);

    if (head_response.IsEmpty()) {
        got_exception_ = true;
        return -1;
    }

    return (int)head_response->IntegerValue();
}

size_t Parser::execute(const char *data, size_t len) {

        size_t nparsed;
        if (state_ == s_http) {
            nparsed = http.execute(this, data, len);
        } else if (state_ == s_jt808) {
            jt808.execute(this, data, len);
            nparsed = len;
        } else if (state_ == s_jt809) {
            jt809.execute(this, data, len);
            nparsed = len;
        } else {
            nparsed = http.execute(this, data, len);
            enum http_errno err = http.error();

            if (err != HPE_INVALID_METHOD) {
                state_ = s_http;
                Nan::HandleScope scope;
                Local<Object> obj = handle();
                Local<Value> cb = obj->Get(kOnProtocol);

                if (cb->IsFunction()) {
                    Local<Value> argv[1] = {Nan::New("http").ToLocalChecked()};
                    Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
                }
            } else {
                state_ = s_maybe808;
                nparsed = len;
            }
        }

        if (state_ == s_maybe808) {
            size_t r = jt808.execute(this, data, len);
            if (r == 0) {
                state_ = s_jt808;
                Nan::HandleScope scope;
                Local<Object> obj = handle();
                Local<Value> cb = obj->Get(kOnProtocol);

                if (cb->IsFunction()) {
                    Local<Value> argv[1] = {Nan::New("jt808").ToLocalChecked()};
                    Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
                }
            } else {
                r = jt809.execute(this, data, len);
                if (r == 0) {
                    state_ = s_jt809;
                    Nan::HandleScope scope;
                    Local<Object> obj = handle();
                    Local<Value> cb = obj->Get(kOnProtocol);

                    if (cb->IsFunction()) {
                        Local<Value> argv[1] = {Nan::New("jt809").ToLocalChecked()};
                        Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
                    }
                }
            }
        }


        // If there was a parse error in one of the callbacks
        // TODO(bnoordhuis) What if there is an error on EOF?
        if (nparsed != len && state_ == s_http && http.isUpgrade()) {
            // treat as not error
            nparsed = len;
        }

        return nparsed;
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
    Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
}


void Parser::onJt809ParseError(unsigned int err,
                    uint32_t msg_len,
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    uint32_t encrypt_key,
                    uint16_t crc,
                    uint16_t crcCal) {

    Nan::HandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOnParserError);

    if (!cb->IsFunction())
        return;

    Local<Value> e = Nan::Error("Parse Error");
    Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
    eobj->Set(Nan::New("code").ToLocalChecked(), Nan::New(http_errno_name((enum http_errno)err)).ToLocalChecked());

    Local<Object> ctx = Nan::New<Object>();
    Nan::Set(ctx, Nan::New("messageLength").ToLocalChecked(), Nan::New(msg_len));
    Nan::Set(ctx, Nan::New("messageId").ToLocalChecked(), Nan::New(msg_id));
    Nan::Set(ctx, Nan::New("centerId").ToLocalChecked(), Nan::New(center_id));
    Nan::Set(ctx, Nan::New("SN").ToLocalChecked(), Nan::New(sn));
    Nan::Set(ctx, Nan::New("encrypt").ToLocalChecked(), Nan::New(encrypt));
    Nan::Set(ctx, Nan::New("encryptKey").ToLocalChecked(), Nan::New(encrypt_key)); 
    Nan::Set(ctx, Nan::New("crc").ToLocalChecked(), Nan::New(crc)); 
    Nan::Set(ctx, Nan::New("crcCal").ToLocalChecked(), Nan::New(crcCal)); 
    char version[20];
    sprintf(version, "%d.%d.%d", ver[0], ver[1], ver[2]);
    Nan::Set(ctx, Nan::New("version").ToLocalChecked(), Nan::New(version).ToLocalChecked());

    eobj->Set(Nan::New("jt809context").ToLocalChecked(), ctx);

    Local<Value> argv[1] = {eobj};
    Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);
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
            Local<Value> r = Nan::MakeCallback(obj, cbPrev.As<Function>(), (int)arraysize(argv), argv);

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
        Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);

    if (r.IsEmpty()) {
      got_exception_ = true;
    }
}

void Parser::onJt809Message(
                    uint32_t sn,
                    uint16_t msg_id,
                    uint32_t center_id,
                    uint8_t* ver,
                    bool encrypt,
                    const pkg_content1& info,
                    const char* data,
                    uint32_t data_size) {

    Nan::HandleScope scope;

    Local<Object> obj = handle();
    Local<Value> cb = obj->Get(kOn809Message);

    if (!cb->IsFunction())
        return;

    Local<Object> pkg = Nan::New<Object>();
    Nan::Set(pkg, Nan::New("messageId").ToLocalChecked(), Nan::New(msg_id));
    Nan::Set(pkg, Nan::New("centerId").ToLocalChecked(), Nan::New(center_id));
    Nan::Set(pkg, Nan::New("SN").ToLocalChecked(), Nan::New(sn));
    Nan::Set(pkg, Nan::New("encrypt").ToLocalChecked(), Nan::New(encrypt));
    char version[20];
    sprintf(version, "%d.%d.%d", ver[0], ver[1], ver[2]);
    Nan::Set(pkg, Nan::New("version").ToLocalChecked(), Nan::New(version).ToLocalChecked());

    bundlePackage(pkg, msg_id, &info, data, data_size);

    Local<Value> argv[1] = {pkg};

    Local<Value> r =
        Nan::MakeCallback(obj, cb.As<Function>(), (int)arraysize(argv), argv);

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

