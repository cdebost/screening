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
	@module screening/component
*/
var Q = require("q"),
    when = Q.when,
    by = require("../webdriver/util").By,
    Session = require("../webdriver/session.js").Session,
    Warning = require('../testcase/warning').Warning,
    Component = require("../agents/component.js").Component;

var WebDriverComponent = exports.WebDriverComponent = function(agent, element){
    Component.call(this, agent, element);
    this.session = (agent ? agent.session : null);
};

WebDriverComponent.prototype = Component.prototype;

WebDriverComponent.prototype.getObjectName = function(){
    return this.agent.executeScript("return arguments[0].controller._montage_metadata.objectName;", [this.element]);
};

WebDriverComponent.prototype.getModuleId = function(){
    return this.agent.executeScript("return arguments[0].controller._montage_metadata.moduleId;", [this.element]);
};

WebDriverComponent.prototype.getProperty = function(propName){
    return this.agent.executeScript("return arguments[0].controller[arguments[1]];", [this.element, propName]);
};

WebDriverComponent.prototype.setProperty = function(propName, value){
    var self = this;
    return this.agent.executeScript("arguments[0].controller[arguments[1]] = arguments[2];", [this.element, propName, value],
        function() {return self;});
};

WebDriverComponent.prototype.callMethod = function(func, args){
    return this.agent.executeScript("var c = arguments[0].controller; return c[arguments[1]].apply(c, arguments[2]);", [this.element, func, args]);
};

/**
 * @private
 */
WebDriverComponent.prototype._syncPrototype = function() {
    var self = this;
    var prototypes = self.agent.executeScript(
            "var component = arguments[0].controller;\n"+
            "var i, type, ret = {};\n" +
            "for(i in component) {\n" +
            "   ret[i] = typeof component[i] === 'function' ? 'function' : 'property';\n" +
            "}\n" +
            "return ret;",
        [self.element]);

    var name, type;
    for(name in prototypes) {
        if(["element", "agent", "session", "sync", "result"].indexOf(name) != -1) { continue; }

        type = prototypes[name];
        switch(type) {
            case "function":
                console.log("Adding function:", name);
                this[name] = function() {
                    return self.callMethod(name, arguments);
                };
                break;
            case "property":
                Object.defineProperty(this, name, {
                    get: function() {
                        return self.getProperty(name);
                    },
                    set: function(value) {
                        self.setProperty(name, value);
                    },
                    enumerable: true,
                    configurable: true
                });
                break;
        }
    }
};
