
#ifndef _TYPES_H__
#define _TYPES_H__

#ifdef __cplusplus
extern "C" {
#endif


#include <sys/types.h>
#if defined(_WIN32) && !defined(__MINGW32__) && \
  (!defined(_MSC_VER) || _MSC_VER<1600) && !defined(__WINE__)
#include <BaseTsd.h>
#include <stddef.h>
typedef __int8 int8_t;
typedef unsigned __int8 uint8_t;
typedef __int16 int16_t;
typedef unsigned __int16 uint16_t;
typedef __int32 int32_t;
typedef unsigned __int32 uint32_t;
typedef __int64 int64_t;
typedef unsigned __int64 uint64_t;
#else
#include <stdint.h>
#endif


#if defined(_WIN32)
#define ALIGNBYTE   __declspec(align(1))
#else
#define ALIGNBYTE   __attribute__((aligned(1),packed))
#endif


#ifdef __cplusplus
}
#endif

#endif

