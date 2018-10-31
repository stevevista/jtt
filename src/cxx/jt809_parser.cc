#include "jt809_parser.h"
#include "utils.h"


#define PARSE_ERROR(e)                                               \
do {                                                                 \
  http_errno_ = (e);                                                 \
  goto errorrecover;                                                 \
} while(0)



//
// parsing header

#define CONSUME_WORD(S, target)                                      \
  case (S):                                                          \
    target = ((uint16_t)ch << 8);                                    \
    break;                                                           \
  case ((S)+1):                                                      \
    target |= ch;                                                    \
    break;

#define CONSUME_DWORD(S, target)                                     \
  case (S):                                                          \
    target = ((uint32_t)ch << 24);                                   \
    break;                                                           \
  case ((S)+1):                                                      \
    target |= ((uint32_t)ch << 16);                                  \
    break;                                                           \
  case ((S)+2):                                                      \
    target |= ((uint32_t)ch << 8);                                   \
    break;                                                           \
  case ((S)+3):                                                      \
    target |= ch;                                                    \
    break;




JT809Parser::JT809Parser(bool debug)
:debugMode_(debug) {

    M1  = 0xfffa; // not zero
    IA1 = 0xfffb;
    IC1 = 0xfffc;

    dataLength_ = 0;
    dataBuffer_ = nullptr;
    dataBufferIndex_ = 0;
    init();
}

JT809Parser::~JT809Parser()
{
    cleanDynamic();
}

void JT809Parser::cleanDynamic() {
    
    if (dataBuffer_) {
        free(dataBuffer_);
        dataBuffer_ = nullptr;
    }
    dataLength_ = 0;
    dataBufferIndex_ = 0;
}

void JT809Parser::init() {
    http_errno_ = 0;
    memset(&info_, 0, sizeof(info_));
    cleanDynamic();
    parsed_len_ = 0;
}


static uint16_t const CRC16Table[256]={               

	0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7, 
	0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef, 
	0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6, 
	0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de, 
	0x2462, 0x3443, 0x0420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485, 
	0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d, 
	0x3653, 0x2672, 0x1611, 0x0630, 0x76d7, 0x66f6, 0x5695, 0x46b4, 
	0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc, 
	0x48c4, 0x58e5, 0x6886, 0x78a7, 0x0840, 0x1861, 0x2802, 0x3823, 
	0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b, 
	0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0x0a50, 0x3a33, 0x2a12, 
	0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a, 
	0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0x0c60, 0x1c41, 
	0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49, 
	0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0x0e70, 
	0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78, 
	0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f, 
	0x1080, 0x00a1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067, 
	0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e, 
	0x02b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256, 
	0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d, 
	0x34e2, 0x24c3, 0x14a0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405, 
	0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c, 
	0x26d3, 0x36f2, 0x0691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634, 
	0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab, 
	0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x08e1, 0x3882, 0x28a3, 
	0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a, 
	0x4a75, 0x5a54, 0x6a37, 0x7a16, 0x0af1, 0x1ad0, 0x2ab3, 0x3a92, 
	0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9, 
	0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0x0cc1, 
	0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8, 
	0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0x0ed1, 0x1ef0  

};

void crc16(unsigned char ch, uint16_t& crc) {
    uint8_t crcregister = crc >> 8;  
    crc <<= 8;  
    crc ^= CRC16Table[crcregister ^ ch];
}



#define HEADER_SIZE 22

size_t JT809Parser::execute(IJT809ParserCallback* callback, const char *data, size_t len) {

    size_t result = 2;

    for (const char *p=data; p != data + len; p++) {
    
errorrecover:
        // try to recover from error, skip all characters until 0x5b
        if (http_errno_ != HPE_OK) {

            result = 3;

            if (callback) {
                
                callback->onJt809ParseError(http_errno_,
                                    msg_len_,
                                    sn_,
                                    msg_id_,
                                    center_id_,
                                    version_,
                                    !!encrypt_,
                                    encrypt_key_,
                                    crc_,
                                    crcCal_);
            }

            parsed_len_ = 0;
            http_errno_ = 0;
            cleanDynamic();
        }

        // finding 0x5b
        if (parsed_len_ == 0) {
            for (; p != data + len && *p != 0x5b; p++) ;
            if (p == (data + len))
                return result;

            if (result == 2)
                result = 1;

            crc_ = 0;
            crcCal_ = 0xffff;
            convert_5b_char_ = false;
            convert_5d_char_ = false;
            msg_len_ = 0xffffffff;
            parsed_len_++;
            continue;
        }

        unsigned char ch = *p;

        // converting character
        if(convert_5b_char_) {
            convert_5b_char_ = false;
            if (ch == 0x01)
                ch = 0x5b;
            else if (ch == 0x02)
                ch = 0x5a;
            else 
                PARSE_ERROR(HPE_BAD_CONVERT_CODE);
        } else if(convert_5d_char_) {
            convert_5d_char_ = false;
            if (ch == 0x01)
                ch = 0x5d;
            else if (ch == 0x02)
                ch = 0x5e;
            else 
                PARSE_ERROR(HPE_BAD_CONVERT_CODE);
        } else {
            if (ch == 0x5a) {
                convert_5b_char_ = true;
                continue;
            }
            if (ch == 0x5e) {
                convert_5d_char_ = true;
                continue;
            }
        }


        parsed_len_++;

        if (parsed_len_ < msg_len_-2) {
            crc16(ch, crcCal_);
        }

        if (parsed_len_ < HEADER_SIZE+2) {
            // parse message length
            switch(parsed_len_) {
                CONSUME_DWORD(2, msg_len_)
                CONSUME_DWORD(6, sn_)
                CONSUME_WORD(10, msg_id_)
                CONSUME_DWORD(12, center_id_)
                case 16:
                case 17:
                case 18:
                    version_[parsed_len_-16] = ch;
                    break;
                case 19:
                    encrypt_ = ch;
                    break;
                CONSUME_DWORD(20, encrypt_key_)
            }
            continue;
        }
        else if (parsed_len_ == HEADER_SIZE + 2) {

            if (msg_len_ < HEADER_SIZE+4) 
                PARSE_ERROR(HPE_BAD_MSG_LEN);

            if (encrypt_key_ == 0)
                encrypt_key_ = 1;

            info_.received = 0;
            contentSize_ = 0;
            dataLengthPtr_ = nullptr;

            switch(msg_id_) {
                case 0x1201:
                    contentSize_ = sizeof(info_.reg);
                    break;

                case 0x1203:
                case 0x9203:
                    contentSize_ = sizeof(info_.multiLocation);
                    break;

                case 0x120a:
                case 0x120c:
                    contentSize_ = sizeof(info_.reportDriver);
                    break;

                case 0x120b:
                case 0x120d:
                    contentSize_ = sizeof(info_.ewaybill);
                    dataLengthPtr_ = (char*)(&info_.ewaybill.length);
                    break;
                    
                case 0x1301:
                case 0x9301:
                case 0x9302:
                    contentSize_ = sizeof(UP_PLATFORM_MSG_POST_QUERY_ACK);
                    break;

                case 0x1402:
                    contentSize_ = sizeof(UP_WARN_MSG_ADPT_INFO);
                    break;

                case 0x9401:
                    contentSize_ = sizeof(info_.warnUrgeTodoReq);
                    break;

                case 0x9402:
                case 0x9403:
                    contentSize_ = sizeof(info_.warnInform);
                    break;
                
                case 0x1502:
                    contentSize_ = sizeof(info_.takePhotoAck);
                    dataLengthPtr_ = (char*)(&info_.takePhotoAck.length);
                    break;

                case 0x1504:
                    contentSize_ = sizeof(info_.takeTravelAck);
                    break;

                case 0x9501:
                    contentSize_ = sizeof(info_.monitorVehicleReq);
                    break;

                case 0x9503:
                    contentSize_ = sizeof(info_.textInfo);
                    break;

                case 0x9204:
                case 0x1601:
                    contentSize_ = sizeof(info_.carInfo);
                    break;

                default:
                    contentSize_ = sizeof(info_.buffer);
                    break;
            }
        }


        if (parsed_len_ == msg_len_-2) {
            crc_ = ((uint16_t)ch) << 8;
        } else if (parsed_len_ == msg_len_-1) {
            crc_ |= ch;

            if (crc_ != crcCal_)
                PARSE_ERROR(HPE_CHECKSUM_ERROR);

        } else if (parsed_len_ == msg_len_) {
                if (ch != 0x5d)
                    PARSE_ERROR(HPE_UNKNOWN_MSG_END);

                result = 0;

                if (info_.received < contentSize_ && contentSize_ != sizeof(info_.buffer)) {
                    memset(info_.buffer+info_.received, 0, contentSize_ - info_.received);
                    info_.received = contentSize_;
                }

                if (callback) {
                    callback->onJt809Message(
                        sn_,
                        msg_id_,
                        center_id_,
                        version_,
                        !!encrypt_,
                        info_,
                        dataBuffer_,
                        dataBufferIndex_);
                }

                parsed_len_ = 0;
                dataBuffer_ = nullptr;
                dataBufferIndex_ = 0;
                dataLength_ = 0;
        } else {
            if (encrypt_) {
                uint32_t key = IA1 * ( encrypt_key_ % M1 ) + IC1;
                ch ^= (unsigned char)((key>>20)&0xFF);
            }

            if (info_.received < contentSize_) {
                info_.buffer[info_.received++] = ch;

                if (info_.received == contentSize_) {
                    
                    if (dataLengthPtr_) {
                        dataLength_ = PINT32(dataLengthPtr_);
                        dataBufferIndex_ = 0;
                        if (dataLength_) {
                            dataBuffer_ = (char*)malloc(dataLength_);
                        }
                    } else if (msg_id_ == 0x1203 || msg_id_ == 0x9203) {
                        if (info_.multiLocation.gnssCount == 0)
                            info_.multiLocation.gnssCount = 1;
                        else if (info_.multiLocation.gnssCount > 5)
                            info_.multiLocation.gnssCount = 5;
                            
                        contentSize_ += sizeof(GNSS)*info_.multiLocation.gnssCount;
                    } else {
                        contentSize_ = sizeof(info_.buffer);
                    }
                }

            } else {
                if (dataBufferIndex_ < dataLength_)
                    dataBuffer_[dataBufferIndex_++] = ch;
            }
        } // for
    }

    return result;
}
