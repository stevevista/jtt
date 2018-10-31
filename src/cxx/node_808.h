#ifndef __NODE_808_H__
#define __NODE_808_H__

#include "jt808_parser.h"
#include "jt809_parser.h"
#include <nan.h>

using v8::Object;
using v8::Value;
using v8::Array;
using v8::Local;
using v8::Integer;
using v8::String;
using v8::Function;
using v8::FunctionTemplate;
using v8::Date;


uint16_t bundlePackage(Local<Object>& pkg, 
                    uint16_t msg_id, 
                    uint16_t package_count,
                    uint16_t package_index, 
                    pkg_content*);


uint32_t bundlePackage(Local<Object>& pkg, 
                    uint16_t msg_id,
                    const pkg_content1*, 
                    const char* data,
                    uint32_t data_size);

#endif
