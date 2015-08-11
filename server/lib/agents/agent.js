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
 * @module screening/agent
 */
var Q = require("q"),
    when = Q.when,
    fs = require("fs"),
    Warning = require('../testcase/warning').Warning;

/**
 * @abstract
 * @class Agent
 * @classdesc The base class for an agent. Specific agents should implement all the methods contained in this class.
 * @exports Agent
 */
var Agent = exports.Agent = function(sync, scriptObject, result){
    this.sync = sync;
    this.scriptObject = scriptObject;
    this.result = result;
    this.firstNavigate = true;
    this.rootElement = null;
};

/**
 * Make the execution wait for the given number of milliseconds.
 * @function wait
 * @param {Integer} ms The given number of milliseconds to wait
 * @return {Agent} A reference to this, to allow chaining.
 */
Agent.prototype.wait = function(ms) {
    var self = this;
    return this.sync.promise(function() {
        var defer = Q.defer();
        setTimeout(function() {
            defer.resolve(self); // Return self to allow chaining
        }, ms ? ms : 0);
        return defer.promise;
    });
};

//
// Abstract Members
//

/**
 * Explicitly end the current test case with the given message.
 * @abstract
 * @function Agent#endTest
 * @param {String} message Message to log about why the test was ended.
 */

/**
 * Close the browser.
 * @abstract
 * @function Agent#close
 */

/**
 * Executes a javascript string on the agent.
 * @abstract
 * @function Agent#executeScript
 * @param {String} script The script to execute
 * @param {Array} args Array of arguments to pass to the script
 * @param {Function} resultCallback Optional callback to mutate the result of the script before returning
 * @return {Promise} Promise which will resolve to the value of the script evaluated
 */

/**
 * Return a reference to ONE node.
 * @abstract
 * @function Agent#element
 * @param {String} selector The CSS query selector or XPath by which to reach a node.
 * @return {Element}
 *
 * @example
 * var node = agent.element('#nodeId'); // Select a node using it's ID, which triggers a CSS query.
 * var node = agent.element('#nodeId .className'); // Select a node using any kind of CSS query.
 *
 * var node = agent.element('//*[@id='search']'); // Select a node using an XPath query.
 */

/**
 * Return a reference to ONE component.
 * @abstract
 * @function Agent#component
 * @param {String} selector The CSS query selector or XPath by which to reach a node.
 * @return {WebDriverComponent|null}
 *
 * @example
 * var node = agent.component('#nodeId'); // Select a node using it's ID, which triggers a CSS query.
 * var node = agent.component('#nodeId .className'); // Select a node using any kind of CSS query.
 *
 * var node = agent.component('//*[@id='search']'); // Select a node using an XPath query.
 */

/**
 * Return a chainable instance that refers to a set of elements.
 * @abstract
 * @function Agent#elements
 * @param {String} selector The XPath or CSS selector which is used to find elements.
 * @return {Elements} An instance of Elements to allow chaining various functions on it.
 */

/**
 * Test if the element defined by the selector exists.
 * @abstract
 * @function Agent#doesElementExist
 * @param {String} selector The CSS query selector or XPath by which to reach a node.
 * @returns {Boolean} Whether the element exists on the page
 *
 * @example
 * agent.doesElementExist(".className") => true
 */

/**
 * Wait for the element defined by the selector, waiting no longer than timeout.<br>
 * If no timeout is given, the option "timeout" is used.
 * @abstract
 * @function Agent#waitForElement
 * @param {String} selector Either an XPath expression or CSS selector.
 * @param {Integer} timeout The max time that this function shall wait.
 */

/**
 * Navigate the browser to the given URL.
 * @abstract
 * @function Agent#gotoUrl
 * @param {String} url The URL to go to.
 */

/**
 * Refreshes the current page. All the webpage elements are reloaded by the browser.
 * @abstract
 * @function Agent#refresh
 */

/**
 * Return the title of the page from the client.
 * @abstract
 * @function Agent#getTitle
 * @returns {String} The title as defined (or modified) in the HTML site.
 */

/**
 * Return the DOM source code of the page from the client.
 * @abstract
 * @function Agent#getSource
 * @returns {String} The current DOM structure of the site.
 */

/**
 * Get the scroll offset of the page.
 * @abstract
 * @function Agent#getScroll
 * @returns {Array} An array of the scroll offset, the array contains x,y, like so: [x, y].
 *
 * @example
 * agent.getScroll() => [100, 2]
 */

/**
 * Set the scroll offset of the page to a certain position.<br>
 * The page scrolls only as far as possible, so be careful when scrolling to 1000,1000<br>
 * that you don't try to check for exactly that position.
 * @abstract
 * @function Agent#setScroll
 * @param {Integer} x The x position to scroll to.
 * @param {Integer} y The y position to scroll to.
 */

/**
 * Get the available window inner-size of the browser window.
 * @abstract
 * @function Agent#getWindowSize
 * @returns {Array} An array of the current screen size: [width, height]
 *
 * @example
 * agent.getWindowSize() => [640, 480]
 */

/**
 * Sizes the visible area of the window to the passed width/height, if possible.
 * @abstract
 * @function Agent#setWindowSize
 * @param {Integer} width The width in pixels of the visible area
 * @param {Integer} height The height in pixels of the visible area
 */

/**
 * Press down the left mouse button at the given coordinate.
 * @abstract
 * @function Agent#mouseDown
 * @param {Number} x X coordinate
 * @param {Number} y Y coordinate
 */

/**
 * Release the left mouse button at the given coordinate.
 * @abstract
 * @function Agent#mouseUp
 * @param {Number} x X coordinate
 * @param {Number} y Y coordinate
 */

/**
 * Perform a mouse move or series of mouse moves
 * @abstract
 * @function Agent#mouseMove
 * @param {Number|Array} x X coordinate or an array of points to move the mouse between
 * @param {Number} y Y coordinate
 */

/**
 * Perform a click at the given coordinate.
 * @abstract
 * @function Agent#click
 * @param {Number} button Optional Mouse button
 * @param {Number} x Optional X coordinate
 * @param {Number} y Optional Y coordinate
 */

/**
 * Perform a double left-click at the given coordinate.
 * @abstract
 * @function Agent#doubleClick
 * @param {Number} x Optional X coordinate
 * @param {Number} y Optional Y coordinate
 */

/**
 * Gets the text of an alert, confirm, or prompt dialog.
 * @abstract
 * @function Agent#getAlertText
 * @return {String} Text of the currently displayed model dialog.
 */

/**
 * Sets the input text of a prompt dialog.
 * @abstract
 * @function Agent#setPromptText
 * @param {String} text Text to input into the prompt
 */

/**
 * Clicks the "Ok" button of an alert, confirm, or prompt dialog.
 * @abstract
 * @function Agent#acceptAlert
 */

/**
 * Clicks the "Cancel" button of a confirm or prompt dialog.
 * @abstract
 * @function Agent#dismissAlert
 */

//
// Deprecated Members
//

// TODO: Old API compatibility, remove soon
/**
 * @deprecated Use setScroll instead.
 * @abstract
 * @function Agent#setScrollTo
 */
Agent.prototype.setScrollTo = Warning.deprecateApi(Agent.prototype.setScroll, "setScrollTo", "Use setScroll instead");

// TODO: Old API compatibility, remove soon
/**
 * Scrolls the page by the given offset.<br>
 * If the current scroll is at 1,1 and you scroll down 1,1 it tries to scroll to position 2,2.<br>
 * Note that the page's max scroll position depends on the page's size and the browser<br>
 * window dimensions.
 * @deprecated Use setScroll instead.
 * @abstract
 * @function Agent#setScrollBy
 * @param {Integer} x The x offset by how many pixels to scroll.
 * @param {Integer} y The y offset by how many pixels to scroll.
 * @returns {Agent} A reference to this, to allow chaining.
 */
Agent.prototype.setScrollBy = Warning.deprecateApi(function () {
    throw new Error("Not Implemented");
}, "setScrollBy", "Use setScroll instead");
