/* <copyright>
 Copyright (c) 2012, Motorola Mobility LLC.
 All Rights Reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 * Neither the name of Motorola Mobility LLC nor the names of its
 contributors may be used to endorse or promote products derived from this
 software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 POSSIBILITY OF SUCH DAMAGE.
 </copyright> */
var Q = require("q"),
    Agent = require("../agents/agent").Agent;

/**
 * @class SocketAgent
 * @extends Agent
 */
var SocketAgent = exports.SocketAgent = function(agent, sync, scriptObject, result) {
    Agent.call(this, sync, scriptObject, result);
    this.socket = agent.socket;
    this.browserName = agent.capabilities.browserName;
};

// Inherit from Agent
SocketAgent.prototype = Object.create(Agent.prototype);

SocketAgent.prototype.executeScript = function(script, args, callback) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("executeScript", script, args, function(err, ret) {
            console.log("Agent executeScript", ret, err);
            if (callback) {
                callback(ret);
            }
            defer.resolve(ret);
        });

        return defer.promise;
    });
};

SocketAgent.prototype.gotoUrl = function(url) {
    var self = this;
    // Navigate to the given URL
    this.sync.promise(function() {
        var defer = Q.defer();

        if(url.indexOf("http") != 0 && url.indexOf("chrome-extension") != 0) {
            // prefix the url with the request origin if it is just relative
            url = self.scriptObject.getOption("global._requestOrigin") + url;
        }

        self._emit("gotoUrl", url, function cb(err) {
            if (err) {
                defer.reject();
            } else {
                defer.resolve();
            }
        });

        return defer.promise;
    });


    //// Query the root element for mouse operations
    //this.rootElement = this.sync.promise(function() {
    //    return self.session.findElement(by.xpath("//html"));
    //});

    return self;
};

/**
 * Wrapper to work around a broadcast issue with socket.io and callbacks. Use the same way as socket's emit.
 * @private
 * @function emit
 */
SocketAgent.prototype._emit = function() {
    // Hack for socket.io
    this.socket.flags = this.socket.flags || {};
    this.socket.flags.broadcast = false;

    this.socket.emit.apply(this.socket, arguments);
};
