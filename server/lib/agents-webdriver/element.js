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
    resultFilter = require('./util').resultFilter,
    Warning = require('../testcase/warning').Warning;
/**
 * @class module:screening/element.WebdriverElement
 * @extends module:screening/element.Element
 */
var WebdriverElement = exports.WebdriverElement = function(agent, element){
    Element.call(this, agent, element);
    this.session = (agent ? agent.session : null);
};

// Inherit from Element
WebdriverElement.prototype = Object.create(Element.prototype);

WebdriverElement.prototype.dispatchEvent = Warning.deprecateApi(function(){
    // I have no idea how this used to work! There doesn't seem to be any code that supports it...
    //throw new Error("API not yet implemented");
    return this;
}, "dispatchEvent");

WebdriverElement.prototype.getAttribute = function(attrName){
    var self = this;
    return this.sync.promise(function() {
        return self.element.getAttribute(attrName);
    }, resultFilter);
};

WebdriverElement.prototype.getInnerText = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.element.getInnerText();
    }, resultFilter);
};

WebdriverElement.prototype.hasAttributeValue = Warning.deprecateApi(function(attrib, expectedValue){
    var self = this;
    return this.sync.promise(function() {
        return when(self.element.getAttribute(attrib), function(ret){
            return ret.value === expectedValue;
        });
    });
}, "hasAttributeValue");

WebdriverElement.prototype.waitForAttributeValue = function(attributeName, expectedAttributeValue, maxTimeout){
    var self = this;
    return this.sync.promise(function() {
        var waitTimeout = self.agent.scriptObject.getOption("timeout");
        var startTime = Date.now(); // Take the time when this command started, since the element selection does an implicit wait, we subtract the time it took later.
        maxTimeout = maxTimeout || self.agent.scriptObject.getOption("timeout");

        var defer = Q.defer();

        var testValue = function(){
            when(self.element.getAttribute(attributeName), function(ret){
                var timeLeft = maxTimeout - (Date.now() - startTime);

                if(ret.value === expectedAttributeValue) {
                    defer.resolve();
                } else {
                    if(timeLeft <= 0) {
                        defer.reject("Attribute did not change to the expected value within the given time limit");
                    } else {
                        setTimeout(testValue, waitTimeout);
                    }
                }
            });
        };
        testValue();

        return defer.promise;
    },
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.waitForAttributeChange = function(attributeName, maxTimeout){
    var self = this;
    return this.sync.promise(function() {
        var waitTimeout = self.agent.scriptObject.getOption("timeout");
        var startTime = Date.now(); // Take the time when this command started, since the element selection does an implicit wait, we subtract the time it took later.
        maxTimeout = maxTimeout || self.agent.scriptObject.getOption("timeout");

        var defer = Q.defer();

        when(self.element.getAttribute(attributeName), function(ret){
            var originalValue = ret.value; // Cache the original value so we can detect when it changes

            var testValue = function(){
                when(self.element.getAttribute(attributeName), function(ret){
                    var timeLeft = maxTimeout - (Date.now() - startTime);

                    if(ret.value !== originalValue) {
                        defer.resolve();
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
    },
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.getScroll = function(){
    return this.agent.executeScript("return [arguments[0].scrollLeft, arguments[0].scrollTop];", [this.element]);
};

WebdriverElement.prototype.setScroll = function(x, y){
    var self = this;
    return this.agent.executeScript("arguments[0].scrollLeft = arguments[1]; arguments[0].scrollTop = arguments[2];", [this.element, x, y],
    function() { return self; } // Allow Chaining
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.setScrollTo = WebdriverElement.prototype.setScroll;

WebdriverElement.prototype.setScrollBy = Warning.deprecateApi(function(x, y){
    var self = this;
    return this.agent.executeScript("arguments[0].scrollLeft += arguments[1]; arguments[0].scrollTop += arguments[2];", [this.element, x, y],
    function() { return self; } // Allow Chaining
    );
}, "setScrollBy");

WebdriverElement.prototype.setAttribute = function(attrName, attrValue){
    var self = this;
    return this.agent.executeScript("arguments[0].setAttribute(arguments[1], arguments[2]);", [this.element, attrName, attrValue],
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.getSelectedIndex = function(){
    return this.agent.executeScript("return arguments[0].selectedIndex;", [this.element]);
};

WebdriverElement.prototype.setSelectedIndex = function(selectedIndex){
    var self = this;

    // We need to force a change event to fire in order to simulate a
    // real user interaction. (Typically selectedIndex won't fire that)
    var script = [
        "arguments[0].selectedIndex = arguments[1];",
        "var changeEvent = document.createEvent('HTMLEvents');",
        "changeEvent.initEvent('change', true, false);",
        "arguments[0].dispatchEvent(changeEvent);"
    ].join("\n");

    return this.agent.executeScript(script, [this.element, selectedIndex],
        function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.getSelectedValue = function(){
    var script = [
        "var index = arguments[0].selectedIndex;",
        "return arguments[0].options[index].value;"
    ].join("\n");

    return this.agent.executeScript(script, [this.element]);
};

WebdriverElement.prototype.setSelectedValue = function(selectedValue){
    var self = this;

    var script = [
        "var i, options = arguments[0].options;",
        "for(i = 0; i < options.length; ++i) {",
        "   if(options[i].value == arguments[1]) {",
        "       arguments[0].selectedIndex = i;",
        "       var changeEvent = document.createEvent('HTMLEvents');",
        "       changeEvent.initEvent('change', true, false);",
        "       arguments[0].dispatchEvent(changeEvent);",
        "       return;",
        "   }",
        "}",
        "throw new Error('Option with value \"' + arguments[1] + '\" not found');"
    ].join("\n");

    return this.agent.executeScript(script, [this.element, selectedValue],
        function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.getText = function(){
    var self = this;
    return this.sync.promise(function() {
        return when(self.element.getTagName(), function(tagName){
            var tagNameLowerCase = tagName.value.toLowerCase();
            if(tagNameLowerCase == 'input' || tagNameLowerCase == 'textarea') {
                return self.element.getValue();
            } else {
                return self.element.getInnerText();
            }
        });
    }, resultFilter);
};

WebdriverElement.prototype.getComputedStyle = function(styleProp){
    var self = this;
    return this.sync.promise(function() {
        return self.element.style(styleProp);
    }, resultFilter);
};

WebdriverElement.prototype.isVisible = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.element.displayed();
    }, resultFilter);
};

WebdriverElement.prototype.isEnabled = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.element.enabled();
    }, resultFilter);
};

WebdriverElement.prototype.isFocused = function(){
    var self = this;
    return this.sync.promise(function() {
        return when(self.session.getActiveElement(), function(el){
            return el.equals(self.element);
        });
    }, resultFilter);
};

WebdriverElement.prototype.focus = function(){
    var self = this;
    return this.agent.executeScript("arguments[0].focus();", [this.element],
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.mouseDown = function(x, y){
    if(x && typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }

    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.element, x, y), function(){
            return self.session.buttonDown();
        });
    },
    function() { return self; }
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.mousedown = Warning.deprecateApi(WebdriverElement.prototype.mouseDown, "mousedown", "Please use mouseDown instead");

WebdriverElement.prototype.mouseUp = function(x, y){
    if(x && typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }

    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.element, x, y), function(){
            return self.session.buttonUp();
        });
    },
    function() { return self; }
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.mouseup = Warning.deprecateApi(WebdriverElement.prototype.mouseUp, "mouseup", "Please use mouseUp instead.");

WebdriverElement.prototype.mouseMove = function(x, y){
    var self = this;
    if(!x.length) {
        if(x && typeof x !== "number") {
            throw Error("Invalid argument. Function only accepts a numeric X and Y coordinates or an array of coordinates");
        }
        return this.sync.promise(function() {
            return self.session.moveTo(self.element, x, y);
        },
        function() { return self; } // Allow Chaining
        );
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
                when(self.session.moveTo(self.element, point.x, point.y), function() {
                    pointId++;
                    // End of list? Exit
                    if(pointId >= points.length) {
                        defer.resolve(self);
                        return;
                    }
                    var nextPoint = points[pointId];
                    setTimeout(nextMove, nextPoint.duration); //TODO: Timing is going to be off on this, can we improve it?
                });
            }
            nextMove();

            return defer.promise;
        });
    }
};
// Old API compatibility, remove soon
WebdriverElement.prototype.mousemove = Warning.deprecateApi(WebdriverElement.prototype.mouseMove, "mousemove", "Please use mouseMove instead.");
WebdriverElement.prototype.mouseMoves = Warning.deprecateApi(WebdriverElement.prototype.mouseMove, "mouseMoves", "Please use mouseMove instead.");

WebdriverElement.prototype.click = function(button, x, y){
    var self = this;
    return this.sync.promise(function() {
        if(x !== undefined || y !== undefined) {
            return when(self.session.moveTo(self.element, x, y), function(){
                return self.session.click(button);
            });
        } else if(button) {
            // TODO: Get button center point
            return when(self.session.moveTo(self.element, 5, 5), function(){
                return self.session.click(button);
            });
        } else {
            return self.element.click(); // Left click at button center
        }
    },
    function() { return self; } // Allow Chaining
    );
};
WebdriverElement.prototype.mouseClick = WebdriverElement.prototype.click;

WebdriverElement.prototype.doubleClick = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        if(x !== undefined || y !== undefined) {
            return when(self.session.moveTo(self.element, x, y), function(){
                return self.session.doubleClick();
            });
        } else {
            // TODO: Get button center point
            return when(self.session.moveTo(self.element, 5, 5), function(){
                return self.session.doubleClick();
            });
        }
    },
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.sendKeys = function(inputString){
    if(typeof inputString !== "string") {
        throw Error("Invalid argument. Function only accepts a string.");
    }

    var self = this;
    return this.sync.promise(function() {
        return self.element.setValue(inputString);
    },
    function() { return self; } // Allow Chaining
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.keypress = Warning.deprecateApi(WebdriverElement.prototype.sendKeys, "keypress", "Please use sendKeys instead.");
WebdriverElement.prototype.keyPress = Warning.deprecateApi(WebdriverElement.prototype.sendKeys, "keyPress", "Please use sendKeys instead.");
WebdriverElement.prototype.keyPresses = Warning.deprecateApi(WebdriverElement.prototype.sendKeys, "keyPresses", "Please use sendKeys instead.");

WebdriverElement.prototype.touchStart = function(x, y){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchDown(x, y);
    },
    function() { return self; } // Allow Chaining
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.touchstart = Warning.deprecateApi(WebdriverElement.prototype.touchStart, "touchstart", "Please use touchStart instead.");

WebdriverElement.prototype.touchEnd = function(x, y){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchUp(x, y);
    },
    function() { return self; } // Allow Chaining
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.touchend = Warning.deprecateApi(WebdriverElement.prototype.touchEnd, "touchend", "Please use touchEnd instead.");

WebdriverElement.prototype.touchMove = function(x, y){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchMove(x, y);
    },
    function() { return self; } // Allow Chaining
    );
};
// Old API compatibility, remove soon
WebdriverElement.prototype.touchmove = Warning.deprecateApi(WebdriverElement.prototype.touchMove, "touchmove", "Please use touchMove instead.");

WebdriverElement.prototype.touchClick = function(){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchClick(self.element);
    },
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.touchDoubleClick = function(){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchDoubleClick(self.element);
    },
    function() { return self; } // Allow Chaining
    );
};

WebdriverElement.prototype.touchLongClick = function(){
    var self = this;
    return this.sync.promise(function() {
       return self.session.touchLongClick(self.element);
    },
    function() { return self; } // Allow Chaining
    );
};

// KeyUp/Down is a deprecated API, stubbed in here only to prevent failures on old scripts.
WebdriverElement.prototype.keyDown = Warning.deprecateApi(function(keys){
    // We really don't have a concept of an arbitrary "key down", so just ignore for now.
    return this;
}, "keyDown", "Please use sendKeys instead.");
// Old API compatibility, remove soon
WebdriverElement.prototype.keydown = Warning.deprecateApi(WebdriverElement.prototype.keyDown, "keydown", "Please use sendKeys instead.");
WebdriverElement.prototype.keyUp = Warning.deprecateApi(function(keys){
    // We really don't have a concept of an arbitrary "key up", so just ignore for now.
    return this;
}, "keyUp", "Please use sendKeys instead.");
// Old API compatibility, remove soon.
WebdriverElement.prototype.keyup = Warning.deprecateApi(WebdriverElement.prototype.keyUp, "keyup", "Please use sendKeys instead.");

