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
var BaseAgent = require("./base-agent.js").BaseAgent,
    RecordingCompiler = require("./recording-compiler.js").RecordingCompiler,
    simpleRequest = require("request"),
    fs = require("fs"),
    Q = require("q"),
    EventEmitter = require("events").EventEmitter;

// TODO: Move to preferences
var MAX_WAIT_FOR_SOCKET_RECONNECT = 10000;
var WAIT_FOR_SOCKET_INTERVAL = 1000;

var SocketAgent = exports.SocketAgent = Object.create(BaseAgent, {

    init: {
        value: function(capabilities, socket, url, io) {
            EventEmitter.call(this);
            this.io = io;
            BaseAgent.init.apply(this, arguments);
            this.type = "socket";
            this.id = this.friendlyName;
            this.capabilities = capabilities;
            this.socket = socket;
            this.address = this.url = url;
            this.io.sockets.in("drivers").emit("agentConnected", this.getSummary());

            this.recordingSession = null;
            this.compiler = Object.create(RecordingCompiler).init();

            this.setDisconnectListener();

            return this;
        }
    },

    setDisconnectListener: {
        value: function() {
            var self = this;
            this.socket.once("disconnect", function() {
                // Wait for a reconnect if we know the socket is temporarily closed
                // (e.g. when the page is refreshed)
                if (self.reconnecting) {
                    var timer = 0;

                    function waitForReconnect() {
                        if (self.reconnecting) {
                            if (timer >= MAX_WAIT_FOR_SOCKET_RECONNECT) {
                                self.emit("socketDisconnected");
                            } else {
                                setTimeout(waitForReconnect,
                                    Math.min(WAIT_FOR_SOCKET_INTERVAL, MAX_WAIT_FOR_SOCKET_RECONNECT-timer));
                            }
                        } else {
                            self.emit("socketReconnected", self.socket);
                        }
                    }
                    waitForReconnect();
                } else {
                    self.emit("socketDisconnected");
                }
            });
        }
    },

    isAvailable: {
        value: function(cb) {
            throw "Not Implemented";
        }
    },

    endTest: {
        value: function(result) {
            this.io.sockets.emit("testCompleted", this.id, result);
            BaseAgent.endTest.apply(this, arguments);
        }
    },

    /**
     * Instruct the agent to start monitoring events. Events that it captures will
     * be related to the server for compilation into a executable script
     * @param {string} url Address of app the agent will be recording
     */
    startRecording: {
        value: function(recordingUrl, options) {
            throw "Not Implemented";
        }
    },

    recorderReady: {
        value: function(socket) {
            throw "Not Implemented";
        }
    },

    /**
     * Instruct the agent to stop monitoring events.
     * @returns Compiled script representation of captured events
     */
    stopRecording: {
        value: function(callback) {
            throw "Not Implemented";
        }
    },

    /**
     * Instruct the agent to pause monitoring events.
     * @returns Compiled script representation of captured events so far
     */
    pauseRecording: {
        value: function(callback) {
            throw "Not Implemented";
        }
    },

    /**
     * Instruct the agent to resume monitoring events.
     * @returns Compiled script representation of captured events
     */
    resumeRecording: {
        value: function(callback) {
            throw "Not Implemented";
        }
    }
});

// Fake inheritance from an EventEmitter
var prop,
    emitterProto = EventEmitter.prototype;
for (prop in emitterProto) {
    SocketAgent[prop] = emitterProto[prop];
}
