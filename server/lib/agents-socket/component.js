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
 * @module screening/component
 */

var Q = require("q"),
    when = Q.when,
    Warning = require('../testcase/warning').Warning,
    Component = require("../agents/component.js").Component;

var SocketComponent = exports.SocketComponent = function(agent, element){
    Component.call(this, agent, element);
    this.socket = agent.socket;
};

SocketComponent.prototype = Component.prototype;

SocketComponent.prototype.getObjectName = function() {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self.socket.emit("component::getObjectName", self.element, function(err, ret) {
            if (err) {
                console.log("ERROR", err);
                defer.reject(err);
            } else {
                console.log("objectName", ret);
                defer.resolve(ret);
            }
        });

        return defer.promise;
    });
};

SocketComponent.prototype.getModuleId = function() {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self.socket.emit("component::getModuleId", self.element, function(err, ret) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(ret);
            }
        });

        return defer.promise;
    });
};

SocketComponent.prototype.getProperty = function(propName) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self.socket.emit("component::getProperty", self.element, propName, function(err, ret) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(ret);
            }
        });

        return defer.promise;
    });
};

SocketComponent.prototype.setProperty = function(propName, value) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self.socket.emit("component::setProperty", self.element, propName, value, function(err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(self);
            }
        });

        return defer.promise;
    });
};

SocketComponent.prototype.callMethod = function(func, args) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();

        self.socket.emit("component::callMethod", self.element, func, args, function(err, ret) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(ret);
            }
        });

        return defer.promise;
    });
};
