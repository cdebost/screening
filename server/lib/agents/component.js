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
    by = require("../webdriver/util").By,
    css2xpath = require("../webdriver/css2xpath"),
    Session = require("../webdriver/session.js").Session,
    resultFilter = require('./util').resultFilter,
    Warning = require('../testcase/warning').Warning;

/**
 * @class module:screening/component.Component
 * @classdesc Provides all methods that can be executed on a selected component.
 */
var Component = exports.Component = function(agent, element){
    this.agent = agent;
    this.element = element;
    this.sync = (agent ? agent.sync : null);
    this.result = (agent ? agent.result : null);
};

/**
 * Return the component's object name
 * @abstract
 * @function module:screening/component.WebDriverComponent#getObjectName
 * @return {String} The component's object name.
 */

/**
 * Return the component's module ID
 * @abstract
 * @function module:screening/component.WebDriverComponent#getModuleId
 * @return {String} The component's module ID
 */

/**
 * Return the value of the specified component property.
 * @abstract
 * @function module:screening/component.WebDriverComponent#getProperty
 * @param {String} propName The property name to query.
 * @return {String} The property value.
 */

/**
 * Set the value of the specified component property.
 * @function module:screening/component.WebDriverAgent#setProperty
 * @param {String} propName The property name to query.
 * @para, value Value to set the property to.
 * @return {Component} A reference to this, to allow chaining.
 */

/**
 * Call a function on the component.
 * @function module:screening/component.WebDriverAgent#callMethod
 * @param {String} func Function name to call.
 * @param {Array} args Array of values to pass to the function as arguments.
 * @return The return value of the called function.
 */
