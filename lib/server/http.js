'use strict';
const assert = require('assert').ok;
const ServerResponse = require('http').ServerResponse;
const IncomingMessage = require('http').IncomingMessage;
const { readStart, readStop } = require('./utils');


exports.parserOnHttpRequest = function(
                                versionMajor, 
                                versionMinor,
                                headers, 
                                method,
                                url, 
                                upgrade,
                                shouldKeepAlive) {

    var parser = this;
    var client = parser._client;
    var socket = parser.socket;

    var req = parser.incoming = new IncomingMessage(parser.socket);
    req.httpVersionMajor = versionMajor;
    req.httpVersionMinor = versionMinor;
    req.httpVersion = versionMajor + '.' + versionMinor;
    req.url = url;
    var n = headers.length;
    req._addHeaderLines(headers, n);
    req.method = method;

    if (upgrade && client.outgoing !== null && !client.outgoing.upgrading) {
        // The client made non-upgrade request, and server is just advertising
        // supported protocols.
        //
        // See RFC7230 Section 6.7
        upgrade = false;
    }

    req.upgrade = upgrade;

    if (!upgrade) {
        // For upgraded connections and CONNECT method request, we'll emit this
        // after parser.execute so that we can capture the first part of the new
        // protocol.
        parserOnIncoming(client, req, shouldKeepAlive);
    }

    return 0;
}

function parserOnIncoming(client, req, shouldKeepAlive) {
    client.incoming.push(req);

    var socket = req.socket;

    // If the writable end isn't consuming, then stop reading
    // so that we don't become overwhelmed by a flood of
    // pipelined requests that may never be resolved.
    if (!socket._paused) {
      var needPause = socket._writableState.needDrain ||
          client.outgoingData >= socket._writableState.highWaterMark;
      if (needPause) {
        socket._paused = true;
        // We also need to pause the parser, but don't do that until after
        // the call to execute, because we may still be processing the last
        // chunk.
        socket.pause();
      }
    }

    var res = new ServerResponse(req);
    res._onPendingData = (delta)=> {
        // `outgoingData` is an approximate amount of bytes queued through all
        // inactive responses. If more data than the high watermark is queued - we
        // need to pause TCP socket/HTTP parser, and wait until the data will be
        // sent to the client.
        client.outgoingData += delta;
        if (socket._paused && client.outgoingData < socket._writableState.highWaterMark)
            return client.socketOnDrain();
    };

    res.shouldKeepAlive = shouldKeepAlive;

    if (socket._httpMessage) {
      // There are already pending outgoing res, append.
      client.outgoing.push(res);
    } else {
      res.assignSocket(socket);
    }

    // When we're finished writing the response, check if this is the last
    // response, if so destroy the socket.
    res.on('finish', ()=> {

        var incoming = client.incoming;

        // Usually the first incoming element should be our request.  it may
        // be that in the case abortIncoming() was called that the incoming
        // array will be empty.
        assert(incoming.length === 0 || incoming[0] === req);

        incoming.shift();

        // if the user never called req.read(), and didn't pipe() or
        // .resume() or .on('data'), then we call req._dump() so that the
        // bytes will be pulled off the wire.
        if (!req._consuming && !req._readableState.resumeScheduled)
            req._dump();

        res.detachSocket(socket);

        if (res._last) {
            socket.destroySoon();
        } else {
            // start sending the next message
            var m = client.outgoing.shift();
            if (m) {
            m.assignSocket(socket);
            }
        }
    });

    client.onHttp(req, res);
}


exports.parserOnHttpBody = function(b, start, len) {
    var parser = this;
    var stream = parser.incoming;

    // if the stream has already been removed, then drop it.
    if (!stream)
        return;

    var socket = stream.socket;

    // pretend this was the result of a stream._read call.
    if (len > 0 && !stream._dumped) {
        var slice = b.slice(start, start + len);
        var ret = stream.push(slice);
        if (!ret)
            readStop(socket);
    }
}


exports.parserOnHttpComplete = function() {
    var parser = this;
    var stream = parser.incoming;

    if (stream) {
        stream.complete = true;
        // For emit end event
        stream.push(null);
    }

    // force to read the next incoming message
    readStart(parser.socket);
}
