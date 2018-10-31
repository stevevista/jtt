#include "jt808_parser.h"
#include "utils.h"


#define PARSE_ERROR(e)                                               \
do {                                                                 \
  http_errno_ = (e);                                                 \
  goto errorrecover;                                                 \
} while(0)



JT808Parser::JT808Parser(bool debug)
:debugMode_(debug)
,rsa_(nullptr) {

    init();
}

JT808Parser::~JT808Parser()
{
    if (rsa_) {
        RSA_free(rsa_);
        rsa_ = nullptr;
    }
}

void JT808Parser::setDecRSA(uint32_t e, uint8_t* n, uint16_t n_size, uint8_t* d, uint16_t d_size) {
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

void JT808Parser::init() {
    http_errno_ = HPE_OK;
    memset(&info_, 0, sizeof(info_));
    parsedLength_ = 0;
}


size_t JT808Parser::execute(IJT808ParserCallback* callback, const char *data, size_t len) {

    size_t result = 2;

    for (const char *p=data; p != data + len; p++) {
    
errorrecover:
        // try to recover from error, skip all characters until 0x7e
        if (http_errno_ != HPE_OK) {

            result = 3;

            if (callback) {
                IMEI_[12] = 0;
                callback->onJt808ParseError(http_errno_,
                                    messageId_,
                                    messageProp_,
                                    serialNo_,
                                    packagesCount_,
                                    packageIndex_,
                                    IMEI_);
            }

            http_errno_ = 0;
            parsedLength_ = 0;
        }

        // finding 0x7e
        if (parsedLength_ == 0) {
            for (; p != data + len && *p != 0x7e; p++) ;
            if (p == (data + len))
                return result;

            if (result == 2)
                result = 1;

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
                return result;
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

            result = 0;

            if (callback) {
                callback->onJt808Message(
                                    messageId_,
                                    contentEncrypted_,
                                    serialNo_,
                                    packagesCount_,
                                    packageIndex_,
                                    IMEI_,
                                    &info_);
            }

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

    return result;
}
