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
/**
 @module screening/element
 */
var Element = require("../agents/element").Element,
    Q = require("q"),
    when = Q.when,
    by = require("../webdriver/util").By,
    css2xpath = require("../webdriver/css2xpath"),
    Warning = require('../testcase/warning').Warning;
/**
 * @class module:screening/element.SocketElement
 * @extends module:screening/element.Element
 */
var SocketElement = exports.SocketElement = function(agent, id){
    Element.call(this, agent, id);
    this.socket = (agent ? agent.socket : null);
};

// Inherit from Element
SocketElement.prototype = Object.create(Element.prototype);

SocketElement.prototype.dispatchEvent = Warning.deprecateApi(function(){
    // I have no idea how this used to work! There doesn't seem to be any code that supports it...
    //throw new Error("API not yet implemented");
    return this;
}, "dispatchEvent");

SocketElement.prototype.getAttribute = function(attrName){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getAttribute", self.element, attrName, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.getInnerText = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getInnerText", self.element, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.hasAttributeValue = Warning.deprecateApi(function(attrib, expectedValue){
    var self = this;
    return this.sync.promise(function() {
        return when(self.getAttribute(attrib), function(ret){
            return ret.value === expectedValue;
        });
    });
}, "hasAttributeValue");

SocketElement.prototype.waitForAttributeValue = function(attributeName, expectedAttributeValue, maxTimeout){
    var self = this;
    return this.sync.promise(function() {
        var waitTimeout = self.agent.scriptObject.getOption("timeout");
        var startTime = Date.now(); // Take the time when this command started, since the element selection does an implicit wait, we subtract the time it took later.
        maxTimeout = maxTimeout || self.agent.scriptObject.getOption("timeout");

        var defer = Q.defer();

        var testValue = function(){
            var defer = Q.defer();

            self._emit("element::getAttribute", self.element, attributeName, function(err, ret) {
                if (err) {
                    defer.reject(err);
                } else {
                    var timeLeft = maxTimeout - (Date.now() - startTime);

                    if(ret === expectedAttributeValue) {
                        defer.resolve(self);
                    } else {
                        if(timeLeft <= 0) {
                            defer.reject("Attribute did not change to the expected value within the given time limit");
                        } else {
                            setTimeout(testValue, waitTimeout);
                        }
                    }
                }
            });
        };
        testValue();

        return defer.promise;
    });
};

SocketElement.prototype.waitForAttributeChange = function(attributeName, maxTimeout){
    var self = this;
    return this.sync.promise(function() {
        var waitTimeout = self.agent.scriptObject.getOption("timeout");
        var startTime = Date.now(); // Take the time when this command started, since the element selection does an implicit wait, we subtract the time it took later.
        maxTimeout = maxTimeout || self.agent.scriptObject.getOption("timeout");

        var defer = Q.defer();

        self._emit("element::getAttribute", self.element, attributeName, function(err, ret){
            if (err) {
                defer.reject(err);
                return;
            }

            var originalValue = ret.value; // Cache the original value so we can detect when it changes

            var testValue = function(){
                self._emit("element::getAttribute", self.element, attributeName, function(err, ret){
                    if (err) {
                        defer.reject(err);
                        return;
                    }

                    var timeLeft = maxTimeout - (Date.now() - startTime);

                    if(ret.value !== originalValue) {
                        defer.resolve(self);
                    } else {
                        if(timeLeft <= 0) {
                            defer.reject("Attribute did not change within the given time limit");
                        } else {
                            setTimeout(testValue, waitTimeout);
                        }
                    }
                });
            };
            setTimeout(testValue, waitTimeout);
        });

        return defer.promise;
    });
};

SocketElement.prototype.getScroll = function() {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getScroll", self.element, function(err, scrollLeft, scrollTop) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve([scrollLeft, scrollTop]);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.setScroll = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::setScroll", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.setScrollTo = SocketElement.prototype.setScroll;

SocketElement.prototype.setScrollBy = Warning.deprecateApi(function(x, y){
    throw new Error("Not implemented");
}, "setScrollBy");

SocketElement.prototype.setAttribute = function(attrName, attrValue){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::setAttribute", self.element, attrName, attrValue, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.getSelectedIndex = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getSelectedIndex", self.element, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.setSelectedIndex = function(selectedIndex){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::setSelectedIndex", self.element, selectedIndex, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.getSelectedValue = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getSelectedValue", self.element, function(err, val) {
             if (err) {
                 defer.reject(err);
             } else {
                 defer.resolve(val);
             }
        });

        return defer.promise;
    });
};

SocketElement.prototype.setSelectedValue = function(selectedValue){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::setSelectedValue", self.element, selectedValue, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.getText = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getText", self.element, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.getComputedStyle = function(styleProp){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::getComputedStyle", self.element, styleProp, function(err, val) {
             if (err) {
                 defer.reject(err);
             } else {
                 defer.resolve(val);
             }
        });

        return defer.promise;
    });
};

SocketElement.prototype.isVisible = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        // TODO: EXTREMELY slow. Better implementation?
        self._emit("element::getComputedStyle", self.element, "display", function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val === 'none');
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.isEnabled = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::isEnabled", self.element, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.isFocused = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::isFocused", self.element, function(err, val) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(val);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.focus = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::focus", self.element, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.mouseDown = function(x, y){
    if(x && typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }

    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::mouseDown", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.mousedown = Warning.deprecateApi(SocketElement.prototype.mouseDown, "mousedown", "Please use mouseDown instead");

SocketElement.prototype.mouseUp = function(x, y){
    if(x && typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }

    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::mouseUp", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.mouseup = Warning.deprecateApi(SocketElement.prototype.mouseUp, "mouseup", "Please use mouseUp instead.");

SocketElement.prototype.mouseMove = function(x, y){
    var self = this;
    if(!x.length) {
        if(x && typeof x !== "number") {
            throw Error("Invalid argument. Function only accepts a numeric X and Y coordinates or an array of coordinates");
        }
        return this.sync.promise(function() {
            var defer = Q.defer();

            self._emit("element::mouseMove", self.element, x, y, function(err) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(self);
                }
            });

            return defer.promise;
        });
    } else {
        // If the first argument is an array, treat this as a series of mouse moves
        var points = x;
        return this.sync.promise(function() {
            var defer = Q.defer();
            var startTime = Date.now();
            var pointId = 0;

            // Loop through all the points
            // TODO: Time-based interpolation?
            function nextMove() {
                var point = points[pointId];

                self._emit("element::mouseMove", self.element, point.x, point.y, function(err) {
                    if (err) {
                        defer.reject(err);
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
// Old API compatibility, remove soon
SocketElement.prototype.mousemove = Warning.deprecateApi(SocketElement.prototype.mouseMove, "mousemove", "Please use mouseMove instead.");
SocketElement.prototype.mouseMoves = Warning.deprecateApi(SocketElement.prototype.mouseMove, "mouseMoves", "Please use mouseMove instead.");

SocketElement.prototype.click = function(button, x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::click", self.element, button, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
SocketElement.prototype.mouseClick = SocketElement.prototype.click;

SocketElement.prototype.doubleClick = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::dblclick", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.sendKeys = function(inputString){
    if(typeof inputString !== "string") {
        throw Error("Invalid argument. Function only accepts a string.");
    }

    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::setValue", self.element, inputString, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.keypress = Warning.deprecateApi(SocketElement.prototype.sendKeys, "keypress", "Please use sendKeys instead.");
SocketElement.prototype.keyPress = Warning.deprecateApi(SocketElement.prototype.sendKeys, "keyPress", "Please use sendKeys instead.");
SocketElement.prototype.keyPresses = Warning.deprecateApi(SocketElement.prototype.sendKeys, "keyPresses", "Please use sendKeys instead.");

SocketElement.prototype.touchStart = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchDown", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.touchstart = Warning.deprecateApi(SocketElement.prototype.touchStart, "touchstart", "Please use touchStart instead.");

SocketElement.prototype.touchEnd = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchUp", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.touchend = Warning.deprecateApi(SocketElement.prototype.touchEnd, "touchend", "Please use touchEnd instead.");

SocketElement.prototype.touchMove = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchMove", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};
// Old API compatibility, remove soon
SocketElement.prototype.touchmove = Warning.deprecateApi(SocketElement.prototype.touchMove, "touchmove", "Please use touchMove instead.");

SocketElement.prototype.touchClick = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchClick", self.element, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.touchDoubleClick = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchDoubleClick", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketElement.prototype.touchLongClick = function(){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self._emit("element::touchLongClick", self.element, x, y, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

// KeyUp/Down is a deprecated API, stubbed in here only to prevent failures on old scripts.
SocketElement.prototype.keyDown = Warning.deprecateApi(function(keys){
    // We really don't have a concept of an arbitrary "key down", so just ignore for now.
    return this;
}, "keyDown", "Please use sendKeys instead.");
// Old API compatibility, remove soon
SocketElement.prototype.keydown = Warning.deprecateApi(SocketElement.prototype.keyDown, "keydown", "Please use sendKeys instead.");
SocketElement.prototype.keyUp = Warning.deprecateApi(function(keys){
    // We really don't have a concept of an arbitrary "key up", so just ignore for now.
    return this;
}, "keyUp", "Please use sendKeys instead.");
// Old API compatibility, remove soon.
SocketElement.prototype.keyup = Warning.deprecateApi(SocketElement.prototype.keyUp, "keyup", "Please use sendKeys instead.");

/**
 * Wrapper to work around a broadcast issue with socket.io and callbacks. Use the same way as socket's emit.
 * @private
 * @function emit
 */
SocketElement.prototype._emit = function() {
    // Hack for socket.io
    this.socket.flags = this.socket.flags || {};
    this.socket.flags.broadcast = false;

    this.socket.emit.apply(this.socket, arguments);
};
