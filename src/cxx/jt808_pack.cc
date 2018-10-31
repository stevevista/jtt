
#include "node_wrap.h"
#include "utils.h"
#include <openssl/rsa.h>


/*
MIICXQIBAAKBgQDMlia7q3XGXbOGCNPvkjOJULjnzGT2wnygMg1y8MKN0aIHLDAA
v1P03swLLxiezYyJP0hnPQupwmR82hO6buhdFbtE3mo1W4XRzBI1VOoeMAFAgWbk
Ue2xtrM+JLXSOQkhaPtXM4zc9UqsXxN4VLHjjQ/eZNm4fH79mNqcRluM3QIDAQAB
AoGAPp46jrhlHOjzGLQ9AheylHXTkocZ4/kVIgcP3L1aHwQp3p4ktyXYcZt7wnSQ
yZJKUHvBEnA50KTCEwDAhxCJJ9/HQROZ8CkKfJpKc6Hp5+odg0myekW8wwle/mgZ
ic0T/orx4OIK+PXbzWV4waQ+lwFyNmjFm8PMLe9E1pKm1lUCQQD8llCo6ulRRdl9
iCGO/R9kwyjoF8CfbVHSuGz5RC40hFLMW3/yiEocdUORiweWDqDl8TZsqYRRTPng
LFFDvMefAkEAz1nOABYtNNro0O5+Daf0AmvnZI11WRnLLpNHaWSf1iSb+/33IqUz
VfIsJxWduBz8Boc+1VwPpoTIJBq8mgcKAwJBAJzT66LlsBXxK5fAlS2Fxh82+UgZ
r1SNeLdAIREnnxSmcA5IZYm9y14eBOTyELS/wnDisqsHGYutIpxoh9Bp/vsCQQC+
L9ETo0Ozx1bkzNwyCmt2DSMgx99q6o3DGrPVp8Yz1UB90mRsErsTih2Ve+4+gddo
5YRsjxSL2B77fsqfPPWhAkAMOyS/qx8PgzwsKHhTrkmbTPXdJ+lDzRVxadpWFL/U
bp3q2UrO3k8oe4hM7TtK0H+wNKZQJ7B4lScDHsvSwTW6
*/

/*

e: 65537
d: 631B129A0BF776E7C77941B7A9060846244B066E9A0F144F4C585F7C6481924E054B3B47020E3
DEFA73386EA05F28EA6B2F8896794362396AF129E13126AC499CC34F0E9E50F3A63C1851C0DD61F3
3E40778819DC0F14D822A4CA35B1BCC4143C4879DDCB7EFA5946E93B07641B439643A815C1F629AB
8FD66A2CB1FE95E4201
n: DAE1B2FCB12DC3FBC6A7F65877EE57CA69D8DB47A9283493A1DBC3CA21E7744E89987208EA265
6B385A931FFA98FC8BA7F39C0BF4B281D3C53857888EEEAC06E3669D11D6CC7CA3D364BE8DE03B83
76A4EF65C8AAE49A40A4E5AB3E9A295F19ED393A00B50BEDF6463480A3CC19E65ECBA40C2FBE2844
66603AC9A987E8D41FD


    unsigned long e= 65537;
    printf("--------------generate RSA key ------------------\n");   
    BIGNUM  *bne = BN_new();  
    BN_set_word(bne, e);  
    RSA *rsa = RSA_new();
    int ret = RSA_generate_key_ex(rsa, 1024, bne, NULL);  
    if(ret!=1) {  
        printf("RSA_generate_key_ex err!/n");  
        return;  
    } 
    printf("e: %s\n", BN_bn2hex(rsa->e));
    printf("d: %s\n", BN_bn2hex(rsa->d));
    printf("n: %s\n", BN_bn2hex(rsa->n));

*/



/*

const uint32_t svr_e = 65537;

const unsigned char svr_d[] = {
0x63,0x1B,0x12,0x9A,0x0B,0xF7,0x76,0xE7,0xC7,0x79,0x41,0xB7,0xA9,0x06,0x08,0x46,0x24,0x4B,0x06,0x6E,0x9A,0x0F,0x14,0x4F,
0x4C,0x58,0x5F,0x7C,0x64,0x81,0x92,0x4E,0x05,0x4B,0x3B,0x47,0x02,0x0E,0x3D,0xEF,0xA7,0x33,0x86,0xEA,0x05,0xF2,0x8E,0xA6,
0xB2,0xF8,0x89,0x67,0x94,0x36,0x23,0x96,0xAF,0x12,0x9E,0x13,0x12,0x6A,0xC4,0x99,0xCC,0x34,0xF0,0xE9,0xE5,0x0F,0x3A,0x63,
0xC1,0x85,0x1C,0x0D,0xD6,0x1F,0x33,0xE4,0x07,0x78,0x81,0x9D,0xC0,0xF1,0x4D,0x82,0x2A,0x4C,0xA3,0x5B,0x1B,0xCC,0x41,0x43,
0xC4,0x87,0x9D,0xDC,0xB7,0xEF,0xA5,0x94,0x6E,0x93,0xB0,0x76,0x41,0xB4,0x39,0x64,0x3A,0x81,0x5C,0x1F,0x62,0x9A,0xB8,0xFD,
0x66,0xA2,0xCB,0x1F,0xE9,0x5E,0x42,0x01
};

const unsigned char svr_n[] = {
0xDA,0xE1,0xB2,0xFC,0xB1,0x2D,0xC3,0xFB,0xC6,0xA7,0xF6,0x58,0x77,0xEE,0x57,0xCA,0x69,0xD8,0xDB,0x47,0xA9,0x28,0x34,0x93,
0xA1,0xDB,0xC3,0xCA,0x21,0xE7,0x74,0x4E,0x89,0x98,0x72,0x08,0xEA,0x26,0x56,0xB3,0x85,0xA9,0x31,0xFF,0xA9,0x8F,0xC8,0xBA,
0x7F,0x39,0xC0,0xBF,0x4B,0x28,0x1D,0x3C,0x53,0x85,0x78,0x88,0xEE,0xEA,0xC0,0x6E,0x36,0x69,0xD1,0x1D,0x6C,0xC7,0xCA,0x3D,
0x36,0x4B,0xE8,0xDE,0x03,0xB8,0x37,0x6A,0x4E,0xF6,0x5C,0x8A,0xAE,0x49,0xA4,0x0A,0x4E,0x5A,0xB3,0xE9,0xA2,0x95,0xF1,0x9E,
0xD3,0x93,0xA0,0x0B,0x50,0xBE,0xDF,0x64,0x63,0x48,0x0A,0x3C,0xC1,0x9E,0x65,0xEC,0xBA,0x40,0xC2,0xFB,0xE2,0x84,0x46,0x66,
0x03,0xAC,0x9A,0x98,0x7E,0x8D,0x41,0xFD
};


,"token":{"type":"Buffer","data":[171,233,106,233,151,102,216,173,232,223,94,248
,228,240,175,25,87,104,191,252,80,3,224,216,24,208,17,168,5,169,15,174,10,116,23
,142,180,156,243,8,49,31,106,123,222,233,220,172,59,16,213,62,129,200,236,4,202,
218,198,6,212,243,253,99,252,180,90,150,166,36,153,113,250,240,98,100,236,179,42
,224,174,194,241,192,236,65,198,95,39,212,226,13,103,58,165,204,142,255,171,6,18
0,66,157,165,205,182,40,202,218,156,129,15,173,246,48,26,17,128,16,179,170,99,4,
147,205,245,200,201]}}
*/

int encrypt(uint8_t* content, uint16_t content_size, uint8_t* out, uint32_t e, uint8_t* n, uint16_t n_size) {

    RSA *rsa = RSA_new();
    BIGNUM  *bne = BN_new();  
    BN_set_word(bne, e);
    rsa->n = BN_bin2bn(n, n_size, NULL);
    rsa->e = bne;

    uint16_t block_size = RSA_size(rsa)-11;
    uint8_t* p_cnt = content;
    uint8_t* p_out = out;
    int enc_count = 0;

    for (uint16_t i=0; i<content_size; i+= block_size, p_cnt+= block_size) {
        uint16_t nleft = (content_size - i);
        if (nleft > block_size) {
            nleft = block_size;
        }

        int r = RSA_public_encrypt(nleft, p_cnt, p_out, rsa,  RSA_PKCS1_PADDING); 
        if (r < 0) {
            return r;
        }
        enc_count += r;
        p_out += r;
    }

    //BN_free(bne);
    RSA_free(rsa);
    return enc_count;
}



static void putb(uint8_t* buffer, uint16_t& offset, uint8_t& checksum, uint8_t ch) {
    if (ch == 0x7e) {
        buffer[offset++] = 0x7d;
        buffer[offset++] = 0x02;
    } else if (ch == 0x7d) {
        buffer[offset++] = 0x7d;
        buffer[offset++] = 0x01;
    } else {
        buffer[offset++] = ch;
    }
    checksum ^= ch;
}

static uint8_t msg_buffer[1024*2]; // should be enough
static uint8_t encoded_buffer[1024]; // should be enough

NAN_METHOD(Parser::Packing) {

    if (info.Length() < 6 ||
        !info[2]->IsString() ||
        !info[5]->IsUint8Array()) {
        return;
    }

    uint32_t msgid = info[0]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[0]).FromJust();
    uint32_t sn = info[1]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[1]).FromJust();

    // imei
    v8::String::Utf8Value imei_obj(info[2]->ToString());
    char* imei_data = *imei_obj;
    size_t imei_len = imei_obj.length();
    if (imei_len > 12)
        imei_len = 12;

    uint32_t pkgcount = info[3]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[3]).FromJust();
    uint32_t pkgsn = info[4]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[4]).FromJust();

    Local<Object> content_obj = info[5].As<Object>();
    uint8_t* content_data = (uint8_t*)node::Buffer::Data(content_obj);
    uint16_t content_len = (uint16_t)node::Buffer::Length(content_obj);

    // too long
    if (content_len > 0x3ff)
        return;


    uint8_t prop_pkg = pkgcount ? 0x20 : 0;
    uint8_t prop_rsa = 0;
    
    if (info.Length() >= 8 && !info[7]->IsUndefined()) {

        // too long
        if (content_len > 819)
            return;

        uint32_t rsa_e = info[6]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[6]).FromJust();
        Local<Object> n_obj = info[7].As<Object>();
        uint8_t* n_data = (uint8_t*)node::Buffer::Data(n_obj);
        size_t n_len = node::Buffer::Length(n_obj);

        int r = encrypt(content_data, content_len, encoded_buffer, rsa_e, n_data, (uint16_t)n_len);
        if (r < 0) {
            return;
        }

        content_data = encoded_buffer;
        content_len = r;
        prop_rsa = 0x04;
    }

    uint8_t prop_len_h = (uint8_t)(content_len >> 8) & 0x03;
    uint8_t prop_len_l = (uint8_t)(content_len &0xff);

    uint16_t offset = 0;
    msg_buffer[offset++] = 0x7e;

    uint8_t checksum = 0;

    // msgid
    putb(msg_buffer, offset, checksum, (uint8_t)(msgid >> 8));
    putb(msg_buffer, offset, checksum, (uint8_t)(msgid & 0xff));
    // prop
    putb(msg_buffer, offset, checksum, (prop_pkg | prop_rsa | prop_len_h));
    putb(msg_buffer, offset, checksum, prop_len_l);
    // imei
    for (size_t i=0; i<6; i++) {
        char v1 = (i*2 < imei_len) ? imei_data[i*2] : '0';
        char v2 = ((i*2+1) < imei_len) ? imei_data[i*2+1] : '0';
        v1 -= '0';
        v2 -= '0';
        putb(msg_buffer, offset, checksum, (v1<<4) | v2);
    }
    // sn
    putb(msg_buffer, offset, checksum, (uint8_t)(sn >> 8));
    putb(msg_buffer, offset, checksum, (uint8_t)(sn & 0xff));

    if (prop_pkg) {
        putb(msg_buffer, offset, checksum, (uint8_t)(pkgcount >> 8));
        putb(msg_buffer, offset, checksum, (uint8_t)(pkgcount & 0xff));
        putb(msg_buffer, offset, checksum, (uint8_t)(pkgsn >> 8));
        putb(msg_buffer, offset, checksum, (uint8_t)(pkgsn & 0xff));
    }

    // content
    for (size_t n=0; n<content_len; n++) {
        putb(msg_buffer, offset, checksum, content_data[n]);
    }

    // checksum
    putb(msg_buffer, offset, checksum, checksum);
    
    msg_buffer[offset++] = 0x7e;

    Local<Object> ret = Nan::CopyBuffer(
                (char*)msg_buffer, offset).ToLocalChecked();
    info.GetReturnValue().Set(ret);
}


/*

function(crc, leftsize, data, encrypt) => [buffer, crc, leftsize]
function(sn, id, centerid, ver, data, encrypt) => [buffer, crc, leftsize]
function(sn, id, centerid, ver, data, data_size, encrypt) => [buffer, crc, leftsize]

*/

void crc16(unsigned char ch, uint16_t& crc);
static void putch809(uint8_t* buffer, uint32_t& offset, uint16_t& crc, uint8_t ch) {
    if (ch == 0x5b) {
        buffer[offset++] = 0x5a;
        buffer[offset++] = 0x01;
    } else if (ch == 0x5a) {
        buffer[offset++] = 0x5a;
        buffer[offset++] = 0x02;
    }  else if (ch == 0x5d) {
        buffer[offset++] = 0x5e;
        buffer[offset++] = 0x01;
    } else if (ch == 0x5e) {
        buffer[offset++] = 0x5e;
        buffer[offset++] = 0x02;
    } else {
        buffer[offset++] = ch;
    }

    crc16(ch, crc);
}


NAN_METHOD(Parser::Packing809) {

    if (info.Length() < 3) {
        return;
    }

    int encryptIndex = -1;
    int contentIndex;
    if (info.Length() < 5) {
        contentIndex = 2; //  function(crc, leftsize, data, encrypt) => [buffer, crc, leftsize]
        if (info.Length() > 3)
            encryptIndex = 3;
    } else {
        contentIndex = 4; //  function(sn, id, centerid, ver, data, data_size, encrypt) => [buffer, crc, leftsize]
        if (info.Length() > 6)
            encryptIndex = 6;
        else if (info.Length() > 5)
            encryptIndex = 5;
    }

    if (!info[contentIndex]->IsUint8Array())
        return;

    bool encrypted = false;
    uint32_t encryptkey = 0;
    uint32_t IA1=0, M1=0, IC1=0;
    uint16_t crc = 0xffff;

    if (encryptIndex >0 && info[encryptIndex]->IsObject()) {
        Local<Object> encrypt_obj = info[encryptIndex].As<Object>();
        Local<Value> key = encrypt_obj->Get(Nan::New("key").ToLocalChecked());
        if (!key->IsUndefined()) {
            encrypted = true;
            encryptkey = Nan::To<uint32_t>(key).FromJust();
            if (encryptkey == 0)
                encryptkey = 1;

            Local<Value> ia1 = encrypt_obj->Get(Nan::New("IA1").ToLocalChecked());
            Local<Value> m1 = encrypt_obj->Get(Nan::New("M1").ToLocalChecked());
            Local<Value> ic1 = encrypt_obj->Get(Nan::New("IC1").ToLocalChecked());

            IA1 = ia1->IsUndefined() ? 0: Nan::To<uint32_t>(ia1).FromJust();
            M1 = m1->IsUndefined() ? 0: Nan::To<uint32_t>(m1).FromJust();
            IC1 = ic1->IsUndefined() ? 0: Nan::To<uint32_t>(ic1).FromJust();
            if (M1 == 0)
                M1 = 1;
        }
    }

    Local<Object> content_obj = info[contentIndex].As<Object>();
    uint8_t* content_data = (uint8_t*)node::Buffer::Data(content_obj);
    uint32_t content_len = node::Buffer::Length(content_obj);
    uint32_t leftsize;

    uint32_t offset = 0;
    uint8_t* buffer = new uint8_t[(4+22+content_len)*2];

    if (info.Length() >= 5) {

        uint32_t total_content = content_len;
        leftsize = total_content;

        uint32_t sn = info[0]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[0]).FromJust();
        uint32_t msgid = info[1]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[1]).FromJust();
        uint32_t centerid = info[2]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[2]).FromJust();
        uint8_t ver[3] = {0,0,0};
        if (info[3]->IsUint8Array()) {
            Local<Object> ver_obj = info[3].As<Object>();
            uint8_t* ver_data = (uint8_t*)node::Buffer::Data(ver_obj);
            uint32_t ver_len = node::Buffer::Length(ver_obj);
            if (ver_len > 3)
                ver_len = 3;
            memcpy(ver, ver_data, ver_len);
        }

        if (info.Length() > 5 && info[5]->IsUint32()) {
            total_content = Nan::To<uint32_t>(info[5]).FromJust();
        } 

        uint32_t msg_len = 4 + 22 + total_content;

        buffer[offset++] = 0x5b;
        putch809(buffer, offset, crc, (msg_len>>24)&0xff);
        putch809(buffer, offset, crc, (msg_len>>16)&0xff);
        putch809(buffer, offset, crc, (msg_len>>8)&0xff);
        putch809(buffer, offset, crc, (msg_len)&0xff);
        putch809(buffer, offset, crc, (sn>>24)&0xff);
        putch809(buffer, offset, crc, (sn>>16)&0xff);
        putch809(buffer, offset, crc, (sn>>8)&0xff);
        putch809(buffer, offset, crc, (sn)&0xff);
        putch809(buffer, offset, crc, (msgid>>8)&0xff);
        putch809(buffer, offset, crc, (msgid)&0xff);
        putch809(buffer, offset, crc, (centerid>>24)&0xff);
        putch809(buffer, offset, crc, (centerid>>16)&0xff);
        putch809(buffer, offset, crc, (centerid>>8)&0xff);
        putch809(buffer, offset, crc, (centerid)&0xff);
        putch809(buffer, offset, crc, ver[0]);
        putch809(buffer, offset, crc, ver[1]);
        putch809(buffer, offset, crc, ver[2]);
        putch809(buffer, offset, crc, encrypted ? 1:0);
        putch809(buffer, offset, crc, (encryptkey>>24)&0xff);
        putch809(buffer, offset, crc, (encryptkey>>16)&0xff);
        putch809(buffer, offset, crc, (encryptkey>>8)&0xff);
        putch809(buffer, offset, crc, (encryptkey)&0xff);
    } else {
        crc = (uint16_t)(info[0]->IsUndefined() ? 0xffff : Nan::To<uint32_t>(info[0]).FromJust());
        leftsize = info[1]->IsUndefined() ? 0 : Nan::To<uint32_t>(info[1]).FromJust();
        if (content_len > leftsize)
            content_len = leftsize;
    }
 
    for (uint32_t i=0; i<content_len; i++) {
        uint8_t ch = content_data[i];
        if (encrypted) {
            uint32_t key = IA1 * ( encryptkey % M1 ) + IC1;
            ch ^= (unsigned char)((key>>20)&0xFF);
        }
        putch809(buffer, offset, crc, ch);
    }

    leftsize -= content_len;
    if (leftsize == 0) {
        uint16_t dummy=0;
        putch809(buffer, offset, dummy, (crc>>8)&0xff);
        putch809(buffer, offset, dummy, crc&0xff);
        buffer[offset++] = 0x5d;
    }

    Local<Array> ret = Nan::New<Array>(3);
        Local<Object> buf = Nan::CopyBuffer(
                (char*)buffer, offset).ToLocalChecked();
    Nan::Set(ret, 0, buf);
    Nan::Set(ret, 1, Nan::New(crc));
    Nan::Set(ret, 2, Nan::New(leftsize));
    info.GetReturnValue().Set(ret);
    delete[] buffer;
}
