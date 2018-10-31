'use strict';


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


function readStart(socket) {
  if (socket && !socket._paused && socket.readable)
    socket.resume();
}

function readStop(socket) {
  if (socket)
    socket.pause();
}



exports.FreeList = FreeList;
exports.readStart = readStart;
exports.readStop = readStop;
