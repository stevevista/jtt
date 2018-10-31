'use strict';

const iconv = require('iconv-lite');
const _ = require('lodash'); 


function createBuffer(fmt, ...args) {

    const fmts = fmt.split(',');
    const vals = [];

    let size = 0;
    fmts.forEach((t, index)=> {
        let value = args[index];

        if (t === 'byte') size+=1;
        else if (t === 'word') size+=2;
        else if (t === 'dword') size+=4;
        else if (t === 'word-list') size+=(value.length*2);
        else if (t === 'dword-list') size+=(value.length*4);
        else {
            let [T, N] = t.split('/');
            N = +N;

            if (value == null) value = '';

            if ((T === 'buf' || T === 'szbuf') && !(value instanceof Buffer)) {
                value = Buffer.from(value);
            } else if (T === 'gbk' || T === 'szgbk') {
                value = iconv.encode(value, 'gbk');
            }

            if (T.indexOf('sz') === 0) {
                if (isNaN(N)) {
                    N = 1;
                }
                if(N >2) N = 2;
                size += N;
                size += value.length;
            } else {
                if (isNaN(N)) {
                    if (T === 'bcd') {
                        N = Math.ceil(value.length/2);
                    } else {
                        N = value.length;
                    }
                }
                size += N;
            }
        }

        vals.push(value);
    });

    return createBufferEx(size, fmts, vals);
}




function createBufferEx(size, fmts, args) {

    const buf = Buffer.allocUnsafe(size);
    let offset = 0;
    fmts.forEach((t, index)=> {
        let value = args[index];
        if (t === 'byte') buf[offset++] = value;
        else if (t === 'word') {
            buf[offset++] = (value & 0xff00) >> 8;
            buf[offset++] = (value & 0xff);
        } else if (t === 'dword') {
            buf[offset++] = (value & 0xff000000) >> 24;
            buf[offset++] = (value & 0xff0000) >> 16;
            buf[offset++] = (value & 0xff00) >> 8;
            buf[offset++] = (value & 0xff);
        } else if (t === 'word-list') {
            value.forEach(v=> {
                buf[offset++] = (v & 0xff00) >> 8;
                buf[offset++] = (v & 0xff);
            });
        } else if (t === 'dword-list') {
            value.forEach(v=> {
                buf[offset++] = (v & 0xff000000) >> 24;
                buf[offset++] = (v & 0xff0000) >> 16;
                buf[offset++] = (v & 0xff00) >> 8;
                buf[offset++] = (v & 0xff);
            });
        } else {
            let [T, N] = t.split('/');
            N = +N;

            if (T.indexOf('sz') === 0) {
                let u = N;
                if (isNaN(u)) u = 1;
                if(u >2) u = 2;
                N = value.length;

                if (u === 1) {
                    buf[offset++] = N;
                } else if (u === 2) {
                    buf[offset++] = (N & 0xff00) >> 8;
                    buf[offset++] = (N & 0xff);
                }
            }

            switch (T) {
                case 'buf':
                case 'gbk':
                case 'szbuf':
                case 'szgbk': {
                    if (isNaN(N)) N = value.length;
                    value.copy(buf, offset, 0, N);
                    if (value.length < N) {
                        offset += value.length;
                        for (let n=value.length; n<N; n++) {
                            buf[offset++] = 0;
                        }
                    } else {
                        offset += N;
                    }
                    break;
                }

                case 'str':
                case 'szstr': {
                    if (isNaN(N)) N = value.length;
                    for (let i=0; i<N; i++) {
                        let c = value.charCodeAt(i) || 0;
                        buf[offset++] = c;
                    }
                    break;
                }

                case 'bcd': {
                    if (isNaN(N)) N = Math.ceil(value.length/2);
                    for (let i=0; i<N; i++) {
                        let c1 = value.charCodeAt(i*2) - 48;
                        let c2 = value.charCodeAt(i*2+1) - 48;
                        if (isNaN(c1) || c1<0 || c1>9) c1 = 0;
                        if (isNaN(c2) || c2<0 || c2>9) c2 = 0;
                        buf[offset++] = (c1 << 4 | c2);
                    }
                    break;
                }
            }
        }
    });

    return buf;
}




class BufferArgs {
    constructor() {
        this.fmts = [];
        this.vals = [];
        this.size = 0;
    }

    byte(v) {
        this.size += 1;
        this.fmts.push('byte');
        this.vals.push(v);
    }

    word(v) {
        this.size += 2;
        this.fmts.push('word');
        this.vals.push(v);
    }

    dword(v) {
        this.size += 4;
        this.fmts.push('dword');
        this.vals.push(v);
    }

    dwordlist(v) {
        this.size += (v.length*4);
        this.fmts.push('dword-list');
        this.vals.push(v);
    }

    bcd(v, N) {
        if (v == null) v = '';
        if (typeof N !== 'number')
            N = Math.ceil(v.length/2);

        this.size += N;
        this.fmts.push(`bcd/${N}`);
        this.vals.push(v);
    }

    buf(v, N) {
        if (v == null) v = Buffer.allocUnsafe(0);
        if (!(v instanceof Buffer)) {
            v = Buffer.from(v);
        }

        if (typeof N !== 'number')
            N = v.length;

        this.size += N;
        this.fmts.push(`buf/${N}`);
        this.vals.push(v);
    }

    str(v, N) {
        if (v == null) v = '';
        if (typeof N !== 'number')
            N = v.length;

        this.size += N;
        this.fmts.push(`str/${N}`);
        this.vals.push(v);
    }

    szstr(v, u=1) {
        if (v == null) v = '';
        if (u > 2) u = 2;
        this.size += (u + v.length);
        this.fmts.push(`szstr/${u}`);
        this.vals.push(v);
    }

    gbk(v, N) {
        this.buf(iconv.encode(v, 'gbk'), N);
    }

    szbuf(v, u = 1) {
        if (v == null) v = Buffer.allocUnsafe(0);
        if (!(v instanceof Buffer)) {
            v = Buffer.from(v);
        }
        if (u > 2) u = 2;
        this.size += (u + v.length);

        this.fmts.push(`szbuf/${u}`);
        this.vals.push(v);
    }

    szgbk(v, u=1) {
        this.szbuf(iconv.encode(v, 'gbk'), u);
    }


    createBuffer() {
        return createBufferEx(this.size, this.fmts, this.vals);
    }
}


exports.createBuffer = createBuffer;
exports.BufferArgs = BufferArgs;
