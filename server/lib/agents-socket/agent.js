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
    Agent = require("../agents/agent").Agent,
    SocketElement = require("./element").SocketElement,
    SocketComponent = require("./component").SocketComponent,
    ElementArray = require("../agents/element").ElementArray;

/**
 * @class SocketAgent
 * @extends Agent
 */
var SocketAgent = exports.SocketAgent = function(agent, sync, scriptObject, result) {
    Agent.call(this, sync, scriptObject, result);
    this.agent = agent;
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

            if (err) {
                defer.reject(err);
            } else {
                if (callback) {
                    callback(ret);
                }
                defer.resolve(ret);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.element = function(selector) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        // TODO: Timeout
        self._emit("element", selector, function(err, id) {
            if (err) {
                defer.reject(selector + ": " + err);
            } else {
                defer.resolve(new SocketElement(self, id));
            }
        });

        return defer.promise;
    })
};

SocketAgent.prototype.component = function(selector) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("component", selector, function(err, ret) {
            if (err) {
                defer.reject(selector + ": " + err);
            } else {
                defer.resolve(new SocketComponent(self, selector));
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.elements = function(selector) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var waitTimeout = parseInt(self.scriptObject.getOption("timeout"));

        self._emit("elements", selector, function(err, ids) {
            if (err) {
                defer.reject(new Error(selector + ": " + err));
            } else {
                defer.resolve(new ElementArray(self, ids));
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.doesElementExist = function(selector) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("doesElementExist", selector, function(err, doesExist) {
            if (err) {
                defer.reject(new Error(selector + ": " + err));
            } else {
                defer.resolve(doesExist);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.waitForElement = function(selector, timeout){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var waitTimeout = timeout ? timeout : parseInt(self.scriptObject.getOption("timeout"));

        self._emit("waitForElement", selector, waitTimeout, function(err, id) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(new SocketElement(self, id));
            }
        });

        return defer.promise;
    });
};

// TODO: Notify the server and expect a connection from an agent on the given url
SocketAgent.prototype.gotoUrl = function(url) {
    var self = this;
    // Navigate to the given URL
    return this.sync.promise(function() {
        var defer = Q.defer();

        if(url.indexOf("http") != 0 && url.indexOf("chrome-extension") != 0) {
            // prefix the url with the request origin if it is just relative
            url = self.scriptObject.getOption("global._requestOrigin") + url;
        }

        self._emit("gotoUrl", url);

        defer.resolve(self);

        return defer.promise;
    });
};

SocketAgent.prototype.refresh = function() {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self.agent.reconnecting = true;
        self._emit("refresh", self.agent.id);

        self.agent.on("socketReconnected", function(socket) {
            self.socket = self.agent.socket = socket;
            self.agent.setDisconnectListener();
            defer.resolve();
        }, false);

        self.agent.on("socketDisconnected", function() {
            defer.reject(new Error("SocketAgent " + self.agent.id + " did not reconnect within the allotted time"));
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getTitle = function() {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("getTitle", function(err, title) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(title);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getSource = function() {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("getSource", function(err, source) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(source);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getScroll = function() {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("getScroll", function(err, coords) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(coords);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getScroll = function(x, y) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("setScroll", x, y, function(err) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getWindowSize = function() {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("getWindowSize", function(err, dimensions) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(dimensions);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.setWindowSize = function() {
    // Ignore, it doesn't make sense to resize an iFrame
    // TODO: Maybe raise a warning if this is called?
};

SocketAgent.prototype.mouseDown = function(x, y) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("mouseDown", x, y, function(err) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.mouseUp = function(x, y) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("mouseUp", x, y, function(err) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.mouseMove = function(x, y){
    var self = this;

    if (!x.length) {
        if(typeof x !== "number") {
            throw Error("Invalid argument. Function only accepts a numeric X and Y coordinates or an array of coordinates");
        }
        return this.sync.promise(function() {
            var defer = Q.defer();

            self._emit("mouseMove", x, y, function(err) {
                if (err) {
                    defer.reject(new Error(err));
                } else {
                    defer.resolve();
                }
            });

            return defer.promise;
        });
    } else {
        // If the first argument is an array, treat this as a series of mouse moves
        var points = x;
        return this.sync.promise(function() {
            var defer = Q.defer();
            var pointId = 0;

            // Loop through all the points
            // TODO: Time-based interpolation?
            function nextMove() {
                var point = points[pointId];

                self._emit("mouseMove", point.x, point.y, function(err) {
                    if (err) {
                        defer.reject(new Error(err));
                    } else {
                        pointId++;
                        // End of list? Exit
                        if(pointId >= points.length) {
                            defer.resolve(self);
                            return;
                        }
                        var nextPoint = points[pointId];
                        setTimeout(nextMove, nextPoint.duration); //TODO: Timing is going to be off on this, can we improve it?
                    }
                });
            }
            nextMove();

            return defer.promise;
        });
    }
};

SocketAgent.prototype.click = function(button, x, y) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("click", button, x, y, function(err) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.doubleClick = function(x, y) {
    var self = this;

    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("doubleClick", x, y, function(err) {
            if (err) {
                defer.reject(new Error(err));
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketAgent.prototype.getAlertText = function() {
    throw new Error("Forbidden on socket agents");
};

SocketAgent.prototype.setPromptText = function() {
    throw new Error("Forbidden on socket agents");
};

SocketAgent.prototype.acceptAlert = function() {
    throw new Error("Forbidden on socket agents");
};

SocketAgent.prototype.dismissAlert = function() {
    throw new Error("Forbidden on socket agents");
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
