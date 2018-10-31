
#ifndef __HTTP_PARSER_H__
#define __HTTP_PARSER_H__

#include "types.h"
#include <vector>
#include <string>


/* Compile with -DHTTP_PARSER_STRICT=0 to make less checks, but run
 * faster
 */
#ifndef HTTP_PARSER_STRICT
# define HTTP_PARSER_STRICT 1
#endif

/* Maximium header size allowed. If the macro is not defined
 * before including this header then the default is used. To
 * change the maximum header size, define the macro in the build
 * environment (e.g. -DHTTP_MAX_HEADER_SIZE=<value>). To remove
 * the effective limit on the size of the header, define the macro
 * to a very large number (e.g. -DHTTP_MAX_HEADER_SIZE=0x7fffffff)
 */
#ifndef HTTP_MAX_HEADER_SIZE
# define HTTP_MAX_HEADER_SIZE (80*1024)
#endif


/* Flag values for http_parser.flags field */
enum flags
  { F_CHUNKED               = 1 << 0
  , F_CONNECTION_KEEP_ALIVE = 1 << 1
  , F_CONNECTION_CLOSE      = 1 << 2
  , F_CONNECTION_UPGRADE    = 1 << 3
  , F_TRAILING              = 1 << 4
  , F_UPGRADE               = 1 << 5
  , F_SKIPBODY              = 1 << 6
  , F_CONTENTLENGTH         = 1 << 7
  };


/* Map for errno-related constants
 *
 * The provided argument should be a macro that takes 2 arguments.
 */
#define HTTP_ERRNO_MAP(XX)                                           \
  /* No error */                                                     \
  XX(OK, "success")                                                  \
                                                                     \
  /* Callback-related errors */                                      \
  XX(CB_HeadersComplete, "the onHeadersComplete callback failed")    \
  XX(CB_Body, "the onBody callback failed")                          \
  XX(CB_MessageComplete, "the onMessageComplete callback failed")    \
                                                                     \
  /* Parsing-related errors */                                       \
  XX(INVALID_EOF_STATE, "stream ended at an unexpected time")        \
  XX(HEADER_OVERFLOW,                                                \
     "too many header bytes seen; overflow detected")                \
  XX(CLOSED_CONNECTION,                                              \
     "data received after completed connection: close message")      \
  XX(INVALID_VERSION, "invalid HTTP version")                        \
  XX(INVALID_METHOD, "invalid HTTP method")                          \
  XX(INVALID_URL, "invalid URL")                                     \
  XX(INVALID_HOST, "invalid host")                                   \
  XX(INVALID_PORT, "invalid port")                                   \
  XX(INVALID_PATH, "invalid path")                                   \
  XX(INVALID_QUERY_STRING, "invalid query string")                   \
  XX(INVALID_FRAGMENT, "invalid fragment")                           \
  XX(LF_EXPECTED, "LF character expected")                           \
  XX(INVALID_HEADER_TOKEN, "invalid character in header")            \
  XX(INVALID_CONTENT_LENGTH,                                         \
     "invalid character in content-length header")                   \
  XX(UNEXPECTED_CONTENT_LENGTH,                                      \
     "unexpected content-length header")                             \
  XX(INVALID_CHUNK_SIZE,                                             \
     "invalid character in chunk size header")                       \
  XX(INVALID_CONSTANT, "invalid constant string")                    \
  XX(INVALID_INTERNAL_STATE, "encountered unexpected internal state")\
  XX(STRICT, "strict mode assertion failed")                         \
  XX(BAD_CONVERT_CODE, "0x7d expect 0x01 or 0x02")                   \
  XX(UNEXPECT_MAGIC, "unexpected 0x7e in message")                   \
  XX(CHECKSUM_ERROR, "checksum error")                               \
  XX(DECRYPT_RSA_FAIL, "rsa error")                                  \
  XX(UNKNOWN_MSG_END, "809 msg end error")                           \
  XX(BAD_MSG_LEN, "809 bad msg length")                              \
  XX(UNKNOWN, "an unknown error occurred")


/* Define HPE_* values for each errno value above */
#define HTTP_ERRNO_GEN(n, s) HPE_##n,
enum http_errno {
  HTTP_ERRNO_MAP(HTTP_ERRNO_GEN)
};
#undef HTTP_ERRNO_GEN



class HttpParser;
class IHttpParserCallback {
public:
    virtual ~IHttpParserCallback() {}
    virtual int onHttpMessageComplete() = 0;
    virtual int onHttpHeadersComplete(
                    unsigned short major, 
                    unsigned short minor,
                    const std::vector<std::string>& headers,
                    const char* method,
                    const std::string& url,
                    bool upgrade,
                    bool keepAlive) = 0;
    virtual int onHttpBody(const char *at, size_t length) = 0;
};


class HttpParser {
public:
    bool isUpgrade() const {
        return !!upgrade_;
    }

    /* If http_should_keep_alive() in the on_headers_complete or
    * on_message_complete callback returns 0, then this should be
    * the last message on the connection.
    * If you are the server, respond with the "Connection: close" header.
    * If you are the client, close the connection.
    */
    bool shouldKeepAlive() const;

    enum http_errno error() const {
        return (enum http_errno)http_errno_;
    }

protected:
    friend class Parser;

    void init();
    

    /* Executes the parser. Returns number of parsed bytes. Sets
    * `parser->http_errno` on error. */
    size_t execute(IHttpParserCallback *callback, const char *data, size_t len);

    void onMessageBegin();
    void onUrl(const char *at, size_t length);
    void onHeaderField(const char *at, size_t length);
    void onHeaderValue(const char *at, size_t length);

    unsigned int http_errno_;
    unsigned int state_;

    /** PRIVATE **/
    unsigned int type : 2;         /* enum http_parser_type */
    unsigned int flags_ : 8;        /* F_* values from 'flags' enum; semi-public */
    unsigned int header_state_ : 7; /* enum header_state from http_parser.c */
    unsigned int index_;        /* index into current matcher */

    uint32_t nread_;          /* # bytes read in various scenarios */
    uint64_t content_length_; /* # bytes in body (0 if no Content-Length header) */

    /** READ-ONLY **/
    unsigned short http_major_;
    unsigned short http_minor_;
    unsigned int method_ : 8;       /* requests only */

    /* 1 = Upgrade header was present and the parser has exited because of that.
    * 0 = No upgrade header present.
    * Should be checked when http_parser_execute() returns in addition to
    * error checking.
    */
    unsigned int upgrade_ : 1;

    std::string url_;
    std::vector<std::string> headers_;
    size_t numFields_;
    size_t numValues_;
};


/* Return a string name of the given error */
const char *http_errno_name(enum http_errno err);

/* Return a string description of the given error */
const char *http_errno_description(enum http_errno err);


#endif

