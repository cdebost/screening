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
	@module screening/agent
*/
var Q = require("q"),
    when = Q.when,
    fs = require("fs"),
    by = require("../webdriver/util").By,
    css2xpath = require("../webdriver/css2xpath"),
    Session = require("../webdriver/session.js").Session,
    resultFilter = require('./util').resultFilter,
    WebDriverComponent = require("./component").WebDriverComponent,
    WebdriverElement = require("./element").WebdriverElement,
    WebdriverElementArray = require("./element").WebdriverElementArray,
    Warning = require('../testcase/warning').Warning,
    Agent = require("../agents/agent").Agent;
/**
 * @class WebDriverAgent
 * @extends Agent
*/
var WebDriverAgent = exports.WebDriverAgent = function(session, sync, scriptObject, result){
    Agent.call(this, sync, scriptObject, result);
    this.session = session;
    this.browserName = session.session.value.browserName;
};

// Inherit from Agent
WebDriverAgent.prototype = Object.create(Agent.prototype);

/**
 * Get the session capabilities object. Can include properties like: browserName, version, platform, javascriptEnabled,
 * takesScreenshot, etc.
 *
 * @example
 * // Get the browserName session property
 * var browserName = agent.getSession().browserName;
 *
 * @see The <a href="http://code.google.com/p/selenium/wiki/JsonWireProtocol#Capabilities_JSON_Object">Capabilities JSON Object</a>
 * @function module:screening/agent.WebDriverAgent#getSession
 */
WebDriverAgent.prototype.getSession = function() {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        if (self.session && self.session.session && self.session.session.value) {
            defer.resolve(self.session.session.value);
        } else {
            defer.reject("Invalid session capabilities object");
        }

        return defer.promise;
    });
};

WebDriverAgent.prototype.endTest = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.close(); // TODO: How is the message passed back to the results?
    },
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.close = function(){
    var self = this;
    return this.sync.promise(function() {
        // Rather than closing the window, just navigate it to a blank page.
        // This allows us to open a "new window" during the same session.
        return self.session.get("about:blank");
    });
};

WebDriverAgent.prototype.executeScript = function(script, args, resultCallback){
    var self = this;
    return this.sync.promise(function() {
        return self.session.executeScript(script, args);
    }, function(ret) {
        if(resultCallback) {
            return resultCallback(ret.value);
        }
        return ret.value;
    });
};

WebDriverAgent.prototype.element = function(selector){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var xpathQuery = self._getXPathQuery(selector);
        var waitTimeout = parseInt(self.scriptObject.getOption("timeout"));

        self.session.setImplicitWait(waitTimeout).then(function() {
            self.session.findElement(by.xpath(xpathQuery)).then(function(element) {
                defer.resolve(new WebdriverElement(self, element));
            }, function(err) {
                defer.reject(selector + ": " + err.value.message);
            });
        }, function(err) {
            defer.reject(selector + ": " + err.value.message);
        });

        return defer.promise;
    });
};

WebDriverAgent.prototype.component = function(selector){
    var self = this;
    var component = this.sync.promise(function() {
        var defer = Q.defer();
        var xpathQuery = self._getXPathQuery(selector);
        var waitTimeout = parseInt(self.scriptObject.getOption("timeout"));

        self.session.setImplicitWait(waitTimeout).then(function() {
            self.session.findElement(by.xpath(xpathQuery)).then(function(element) {
                var script = "if(arguments[0].controller) {return true;} else {return false;}";
                self.session.executeScript(script, [element.rawElement]).then(function(hasController) {
                    if(hasController.value) {
                        defer.resolve(new WebDriverComponent(self, element));
                    } else {
                        defer.reject(selector + " has no associated component");
                    }
                }, function(err) {
                    defer.reject(selector + ": " + err.value.message);
                });
            }, function(err) {
                defer.reject(selector + ": " + err.value.message);
            });
        }, function(err) {
            defer.reject(selector + ": " + err.value.message);
        });

        return defer.promise;
    });

    // TODO: Enable at your own risk!
    //component._syncPrototype();
    return component;
};

WebDriverAgent.prototype.elements = function(selector){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var xpathQuery = self._getXPathQuery(selector);
        var waitTimeout = parseInt(self.scriptObject.getOption("timeout"));

        self.session.setImplicitWait(waitTimeout).then(function() {
            self.session.findElements(by.xpath(xpathQuery)).then(function(elements) {
                defer.resolve(new WebdriverElementArray(self, elements));
            }, function(err) {
                defer.reject(selector + ": " + err.value.message);
            });
        }, function(err) {
            defer.reject(selector + ": " + err.value.message);
        });

        return defer.promise;
    });
};

WebDriverAgent.prototype.doesElementExist = function(selector){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var xpathQuery = self._getXPathQuery(selector);

        self.session.findElement(by.xpath(xpathQuery)).then(function() {
            defer.resolve(true);
        }, function() {
            defer.resolve(false);
        });
        return defer.promise;
    });
};

WebDriverAgent.prototype.waitForElement = function(selector, timeout){
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        var xpathQuery = self._getXPathQuery(selector);
        var waitTimeout = timeout ? timeout : parseInt(self.scriptObject.getOption("timeout"));

        self.session.setImplicitWait(waitTimeout).then(function() {
            self.session.findElement(by.xpath(xpathQuery)).then(function(element) {
                defer.resolve(new WebdriverElement(self, element));
            }, function(err) {
                defer.reject(err);
            });
        });

        return defer.promise;
    });
};

WebDriverAgent.prototype.gotoUrl = function(url){
    var self = this;
    // Navigate to the given URL
    this.sync.promise(function() {
        var defer = Q.defer();

        if(url.indexOf("http") != 0 && url.indexOf("chrome-extension") != 0) {
            // prefix the url with the request origin if it is just relative
            url = self.scriptObject.getOption("global._requestOrigin") + url;
        }

        // On the initial run of the webdriver execution we open a separate window
        // to allow control of the window size (chrome does not allow resizing a main window)
        if(self.browserName === "chrome" && self.firstNavigate){
            self.firstNavigate = false;
            self.session.get(url).then(function() {
                self.session.executeScript("window.open('" + url + "', 'interactionWindow', 'resizable=yes');").then(function(){
                    self.session.switchToWindow("interactionWindow").then(function(){
                        setTimeout(function() {
                            defer.resolve();
                            self._installVisualization();
                        }, self.scriptObject.getOption("loadTimeout"));
                    }, defer.reject);
                });
            });
        } else {
            self.session.get(url).then(function(){
                setTimeout(function() {
                    defer.resolve();
                    self._installVisualization();
                }, self.scriptObject.getOption("loadTimeout"));
            }, defer.reject);
        }

        return defer.promise;
    });



    // Query the root element for mouse operations
    this.rootElement = this.sync.promise(function() {
        return self.session.findElement(by.xpath("//html"));
    });

    return self;
};

WebDriverAgent.prototype.refresh = function() {
    var self = this;

    self.sync.promise(function() {
        var defer = Q.defer();

        self.session.refresh().then(function successCb() {
            setTimeout(function() {
                defer.resolve();
                self._installVisualization();
            }, self.scriptObject.getOption("loadTimeout"));
        }, defer.reject);

        return defer.promise;
    });

    // Query the root element for mouse operations
    this.rootElement = this.sync.promise(function() {
        return self.session.findElement(by.xpath("//html"));
    });

    return self;
};

WebDriverAgent.prototype.getTitle = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.getTitle();
    }, resultFilter);
};

WebDriverAgent.prototype.getSource = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.getSource();
    }, resultFilter);
};

WebDriverAgent.prototype.getScroll = function(){
    return this.executeScript("return [window.pageXOffset, window.pageYOffset];");
};

WebDriverAgent.prototype.setScroll = function(x, y){
    var self = this;
    return this.executeScript("window.scrollTo(arguments[0], arguments[1]);", [x, y],
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.setScrollBy = Warning.deprecateApi(function(x, y){
    var self = this;
    return this.executeScript("window.scrollBy(arguments[0], arguments[1]);", [x, y],
    function() { return self; } // Allow Chaining
    );
}, "setScrollBy");


WebDriverAgent.prototype.getWindowSize = function(){
    return this.executeScript("return [window.innerWidth, window.innerHeight];");
};

WebDriverAgent.prototype.setWindowSize = function(width, height){
    var self = this;
    return this.executeScript(
        "window.resizeTo(" +
        "   arguments[0]+window.outerWidth-window.innerWidth," +
        "   arguments[1]+window.outerHeight-window.innerHeight" +
        ");", [width, height],
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.mouseDown = function(x, y){
    if(typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }
    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.rootElement, x, y), function(){
            return self.session.buttonDown();
        });
    },
    function() { return self; }
    );
};

WebDriverAgent.prototype.mouseUp = function(x, y){
    if(typeof x !== "number") {
        throw Error("Invalid argument. Function only accepts a numeric X and Y coordinate.");
    }
    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.rootElement, x, y), function(){
            return self.session.buttonUp();
        });
    },
    function() { return self; }
    );
};

WebDriverAgent.prototype.mouseMove = function(x, y){
    var self = this;
    if(!x.length) {
        if(typeof x !== "number") {
            throw Error("Invalid argument. Function only accepts a numeric X and Y coordinates or an array of coordinates");
        }
        return this.sync.promise(function() {
            return self.session.moveTo(self.rootElement, x, y);
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
                when(self.session.moveTo(self.rootElement, point.x, point.y), function successCb() {
                    pointId++;
                    // End of list? Exit
                    if(pointId >= points.length) {
                        defer.resolve(self);
                        return;
                    }
                    var nextPoint = points[pointId];
                    setTimeout(nextMove, nextPoint.duration); //TODO: Timing is going to be off on this, can we improve it?
                }, function failCb(res) {
                    defer.reject(res);
                });
            }
            nextMove();

            return defer.promise;
        });
    }
};

WebDriverAgent.prototype.click = function(button, x, y){
    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.rootElement, x, y), function(){
            return self.session.click(button);
        });
    },
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.doubleClick = function(x, y){
    var self = this;
    return this.sync.promise(function() {
        return when(self.session.moveTo(self.rootElement, x, y), function(){
            return self.session.doubleClick();
        });
    },
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.getAlertText = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.getAlertText();
    }, resultFilter);
};

WebDriverAgent.prototype.setPromptText = function(text){
    var self = this;
    return this.sync.promise(function() {
        return self.session.setPromptText(text);
    },
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.acceptAlert = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.acceptAlert();
    },
    function() { return self; } // Allow Chaining
    );
};

WebDriverAgent.prototype.dismissAlert = function(){
    var self = this;
    return this.sync.promise(function() {
        return self.session.dismissAlert();
    },
    function() { return self; } // Allow Chaining
    );
};

/**
 * @private
 */
WebDriverAgent.prototype.debugger = function(){
    var self = this;
    return this.executeScript("debugger;", [],
        function() { return self; } // Allow Chaining
    );
};

/**
 * @private
 */
WebDriverAgent.prototype._getXPathQuery = function(selectorString){
    var xpathQuery = selectorString;
    // TODO: this check is not sufficient
    if (xpathQuery.indexOf('/')!=0) {
        // converting css queries to xpath
        xpathQuery = css2xpath(xpathQuery);
    }
    return xpathQuery;
};

/**
 * @private
 */
WebDriverAgent.prototype._installVisualization = function() {
    var self = this;
    // Install the playback visualization layer

    // [gh-224] the visualizer is only compatible with Chrome ATM
    if(self.browserName === "chrome") {
        fs.readFile(__dirname + "/visualizer.js", 'utf8', function(err, visScript) {
            if(err) { console.log(err); return; }

            // Inject the recording script into the page
            when(self.session.executeScript(visScript), function() {
                // Success
            }, function(err) {
                console.log("Visualization Script Failed", err.value.message);
            });
        });
    }
};
