'use strict';
const binding = require('bindings')('complex_parser');
const ComplexParser = binding.ComplexParser;

const {
    kOn808Message,
    kOnParserError
} = ComplexParser;


const FreeList = require('./utils').FreeList;
const assert = require('assert').ok;

const parsers = new FreeList('parsers', 1000, function() {

    var parser = new ComplexParser();
    parser.socket = null;
    parser.incoming = null;
    parser.outgoing = null;
    return parser;
})

function freeParser(parser, req, socket) {
  if (parser) {
    if (parser.socket)
      parser.socket.parser = null;
    parser.socket = null;
    parser.incoming = null;
    parser.outgoing = null;
    if (parsers.free(parser) === false)
      parser.close();
    parser = null;
  }
  if (req) {
    req.parser = null;
  }
  if (socket) {
    socket.parser = null;
  }
}



module.exports =
class Connection {
    constructor(socket, jttListener, onError) {

        this.socket = socket;

        var parser = parsers.alloc();
        parser.reinitialize();
        parser.socket = socket;
        socket.parser = parser;

        this.outgoingData = 0; 
        var outgoing = [];
        this.outgoing = outgoing;
        this.incoming = [];
        parser._client = this;

        function ondrain() {
            if (this._httpMessage) this._httpMessage.emit('drain');
        }
        socket.removeListener('drain', ondrain);
        socket.on('drain', ondrain);

        socket.addListener('close', ()=> {
            // mark this parser as reusable
            freeParser(parser, null, this);
        });

        socket.addListener('error', (e)=> {
            // Ignore further errors
            socket.on('error', () => {});
            if (!onError(e))
                socket.destroy(e);
        });

        // setup jt808 events
        socket.addListener('close', ()=> {
            jttListener(null, socket);
        })

        socket.on('end', ()=> {
            jttListener(null, socket);
        });

        socket.on('data', (d)=> {
            assert(!socket._paused);
            var ret = parser.execute(d);

            if (ret instanceof Error) {
                onError(ret);
            }

            if (socket._paused) {
                // onIncoming paused the socket, we should pause the parser as well
                parser.pause();
            }
        });

        socket.on('resume', ()=> {
            // It may seem that the socket is resumed, but this is an enemy's trick to
            // deceive us! `resume` is emitted asynchronously, and may be called from
            // `incoming.readStart()`. Stop the socket again here, just to preserve the
            // state.
            //
            // We don't care about stream semantics for the consumed socket anyway.
            if (socket._paused) {
                socket.pause();
                return;
            }

            if (socket._handle && !socket._handle.reading) {
                socket._handle.reading = true;
                socket._handle.readStart();
            }
        });
        socket.on('pause', ()=> {
            if (socket._handle && socket._handle.reading) {
                socket._handle.reading = false;
                socket._handle.readStop();
            }
        });

        socket.on('drain', this.socketOnDrain.bind(this));

    
        socket._paused = false;

        parser[kOnParserError] = (e)=> {
            onError(e);
        }

        parser[kOn808Message] = (pkg)=> {
            jttListener(pkg, socket);
        }
    }
    
    socketOnDrain() {
        var socket = this.socket;
        var needPause = this.outgoingData > socket._writableState.highWaterMark;

        // If we previously paused, then start reading again.
        if (socket._paused && !needPause) {
            socket._paused = false;
            socket.parser.resume();
            socket.resume();
        }
    }
}
