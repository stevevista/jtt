
#include "node_wrap.h"
#include "utils.h"
#include "node_808.h"

const uint32_t kOn808Message = 4;
const uint32_t kOn808MessagePrev = 5;
const uint32_t kOnParserError = 7;

Parser::Parser(bool debug)
:jt808(debug) {
    Initialize();
}

void Parser::Initialize() {
    jt808.init();
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
        Local<Value> e = Nan::Error("Parse Error");
        Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
        eobj->Set(Nan::New("bytesParsed").ToLocalChecked(), Nan::New((uint32_t)nparsed));

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
        Local<Value> e = Nan::Error("Parse Error");
        Local<Object> eobj = e->ToObject(v8::Isolate::GetCurrent());
        eobj->Set(Nan::New("bytesParsed").ToLocalChecked(), Nan::New((uint32_t)0));
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

NAN_METHOD(Parser::Close) {
}

size_t Parser::execute(const char *data, size_t len) {
    jt808.execute(this, data, len);
    return len;
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

