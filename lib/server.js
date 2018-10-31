'use strict';
const net =  require("net")
const binding = require('bindings')('complex_parser');
const ComplexParser = binding.ComplexParser;

const {
    kOn808Message,
    kOnParserError
} = ComplexParser;

const assert = require('assert').ok;


// This is a free list to avoid creating so many of the same object.
class FreeList {
    constructor(name, max , ctor) {
        this.name = name;
        this.ctor = ctor;
        this.max = max;
        this.list = [];
    }

    alloc() {
        return this.list.length ? this.list.pop() :
                            this.ctor.apply(this, arguments);
    } 

    free(obj) {
        if (this.list.length < this.max) {
            this.list.push(obj);
            return true;
        }
        return false;
    }
}

const parsers = new FreeList('parsers', 1000, function() {

    var parser = new ComplexParser();
    parser.socket = null;
    return parser;
})

function freeParser(parser, req, socket) {
  if (parser) {
    if (parser.socket)
      parser.socket.parser = null;
    parser.socket = null;
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



function handleConnect(socket, jttListener, onError) {

    const parser = parsers.alloc();
    parser.reinitialize();
    parser.socket = socket;
    socket.parser = parser

    socket.addListener('close', () => {
        // mark this parser as reusable
        freeParser(parser, null, this)
    })

    socket.addListener('error', (e)=> {
        // Ignore further errors
        socket.on('error', () => {})
        if (!onError(e))
            socket.destroy(e);
    })

    // setup jt808 events
    socket.addListener('close', ()=> {
        jttListener(null, socket);
    })

    socket.on('end', ()=> {
        jttListener(null, socket);
    });

    socket.on('data', (d)=> {
        assert(!socket._paused);
        parser.execute(d)
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
            socket._handle.reading = true
            socket._handle.readStart()
        }
    });

    socket.on('pause', () => {
        if (socket._handle && socket._handle.reading) {
            socket._handle.reading = false;
            socket._handle.readStop();
        }
    });

    socket.on('drain', () => {
            // If we previously paused, then start reading again.
            if (socket._paused) {
                socket._paused = false;
                socket.resume();
            }
    })

    
    socket._paused = false;

    parser[kOnParserError] = (e) => {
        onError(e);
    }

    parser[kOn808Message] = pkg => {
        jttListener(pkg, socket)
    }
}

exports.createServer = function(jt808Listener, onError = () => {}) {

    return net.createServer({allowHalfOpen: true}, (stream)=> {
        handleConnect(stream, jt808Listener, onError)
    })
}
