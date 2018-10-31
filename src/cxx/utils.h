#ifndef __UTILS_H__
#define __UTILS_H__

#include <assert.h>
#include <stddef.h>
#include <ctype.h>
#include <string.h>


#ifdef __cplusplus
extern "C" {
#endif



#ifndef ULLONG_MAX
# define ULLONG_MAX ((uint64_t) -1) /* 2^64-1 */
#endif

#ifndef MIN
# define MIN(a,b) ((a) < (b) ? (a) : (b))
#endif

#ifndef ARRAY_SIZE
# define ARRAY_SIZE(a) (sizeof(a) / sizeof((a)[0]))
#endif

#ifdef __GNUC__
# define LIKELY(X) __builtin_expect(!!(X), 1)
# define UNLIKELY(X) __builtin_expect(!!(X), 0)
#else
# define LIKELY(X) (X)
# define UNLIKELY(X) (X)
#endif


#ifndef BIT_AT
# define BIT_AT(a, i)                                                \
  (!!((unsigned int) (a)[(unsigned int) (i) >> 3] &                  \
   (1 << ((unsigned int) (i) & 7))))
#endif

#ifndef ELEM_AT
# define ELEM_AT(a, i, v) ((unsigned int) (i) < ARRAY_SIZE(a) ? (a)[(i)] : (v))
#endif


#define CR                  '\r'
#define LF                  '\n'
#define LOWER(c)            (unsigned char)(c | 0x20)
#define IS_ALPHA(c)         (LOWER(c) >= 'a' && LOWER(c) <= 'z')
#define IS_NUM(c)           ((c) >= '0' && (c) <= '9')
#define IS_ALPHANUM(c)      (IS_ALPHA(c) || IS_NUM(c))
#define IS_HEX(c)           (IS_NUM(c) || (LOWER(c) >= 'a' && LOWER(c) <= 'f'))
#define IS_MARK(c)          ((c) == '-' || (c) == '_' || (c) == '.' || \
  (c) == '!' || (c) == '~' || (c) == '*' || (c) == '\'' || (c) == '(' || \
  (c) == ')')
#define IS_USERINFO_CHAR(c) (IS_ALPHANUM(c) || IS_MARK(c) || (c) == '%' || \
  (c) == ';' || (c) == ':' || (c) == '&' || (c) == '=' || (c) == '+' || \
  (c) == '$' || (c) == ',')



#ifdef __cplusplus
}


template <typename T, size_t N>
constexpr size_t arraysize(const T(&)[N]) { return N; }


#endif


// convert helper
#define PINT32(p)                                                    \
  (((uint32_t)*(p))<<24) | (((uint32_t)*((p)+1))<<16) | (((uint32_t)*((p)+2))<<8) | ((uint32_t)*((p)+3))

#define PINT16(p)                                                    \
  (((uint16_t)*(p))<<8) | ((uint16_t)*((p)+1))

#define PINTX(p, l)                                                  \
  ((l) == 4 ? PINT32(p) : ((l) == 2? (uint32_t)PINT16(p) : (uint32_t)(*(p))))


// big endian swap

#define Swap16(s) ((((s) & 0xff) << 8) | (((s) >> 8) & 0xff)) 

#define Swap32(l) (((l) >> 24) | \
           (((l) & 0x00ff0000) >> 8)  | \
           (((l) & 0x0000ff00) << 8)  | \
           ((l) << 24))
           

#endif
