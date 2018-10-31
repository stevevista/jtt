'use strict';

const {RSA} = require('./jtt/rsa');

module.exports = function(app) {

    app.post('/command/:cmd', (req, res, next)=> {
        const opt = req.body.opt ? JSON.parse(req.body.opt) : {};
        let prop = req.body.prop ? JSON.parse(req.body.prop) : {};
        const cmd = req.params.cmd;
        switch(cmd) {
            case 'custom':
                opt.content = Buffer.from([1,2,3,4]);
                break;
            case 'requireRSA':
                prop = RSA;
                break;
            case 'setParams':
                prop = [
                    [0x0017, 'backup adrr'],
                    [0x0018, 1883]
                ]
                break;
            case 'queryParams':
                prop = [5,4,3,1];
                break;
            case 'controlTerminal':
                prop.cmd = 4;
                prop.params = 'kit;参数';
                break;
        }
        let [info, r] = req.jtt[cmd](req.body.imei, prop, opt);
        r.then(out=> {
            console.log('ack pint'.bgRed);
            if (out instanceof Error)
                res.json(out.message);
            else
                res.json(out);
        })
    });
    
    app.post('/command/requestDriver', (req, res)=> {

        jtt.requestDrvierIdentity(req.body.imei).then(out=> {
            out = out.map(r=> {
                if (r instanceof Error) {
                    return r.message;
                }
                return r
            })
            res.json(out);
        });
        
    });

    app.post('/command/request-postion', (req, res)=> {

        jtt.requestPosition(req.body.imei).then(out=> {
            out = out.map(r=> {
                if (r instanceof Error) {
                    return r.message;
                }
                return r
            })
            res.json(out);
        });
        
    });

    app.post('/command/query-media', (req, res, next)=> {

        jtt.queryMedia(req.body.imei, {type:1}).then(out=> {
            out = out.map(r=> {
                if (r instanceof Error) {
                    return r.message;
                }
                return r
            })
            res.json(out);
        }).catch(e=> next(e));
        
    });

    app.post('/command/upload-media', (req, res, next)=> {

        jtt.uploadMedia(req.body.imei, {mediaId:1}).then(out=> {
            out = out.map(r=> {
                if (r instanceof Error) {
                    return r.message;
                }
                return r
            })
            res.json(out);
        }).catch(e=> next(e));
        
    });

    app.post('/command/request', (req, res, next)=> {

        jtt.request(req.body.imei, {messageId:0x8e00, content: Buffer.from([
            +req.body.p0,
            +req.body.p1,
            +req.body.p2,
            +req.body.p3
        ])}).then(out=> {
            out = out.map(r=> {
                if (r instanceof Error) {
                    return r.message;
                }
                return r
            })
            res.json(out);
        }).catch(e=> next(e));
        
    });
}
