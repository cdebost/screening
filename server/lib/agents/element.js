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
var Q = require("q"),
    when = Q.when,
    by = require("../webdriver/util").By,
    css2xpath = require("../webdriver/css2xpath"),
    resultFilter = require('./util').resultFilter,
    Warning = require('../testcase/warning').Warning;
/**
 * @class module:screening/element.Element
 * @classdesc This class provides all methods that can be executed on a selected element.<br>
 * Normally it is returned by browser.element() in order to allow passing references<br>
 * around, see the examples (and tests) below.
 * @example:
 *  >>> // Verify that the returned value really is an instance of Element.
 *  >>> var el = browser.element('WHATEVER');
 *  el instanceof Element
 *
 *  >>> // Verify that the parameter passed to element() is provided in Element._selector
 *  >>> var el = browser.element('WHATEVER1');
 *  el._selector == 'WHATEVER1'
 */
var Element = exports.Element = function(agent, element){
    this.agent = agent;
    this.element = element;
    this.sync = (agent ? agent.sync : null);
    this.result = (agent ? agent.result : null);
};

/**
 * Return the HTML content of the selected element.
 * @function module:screening/element.Element#getInnerHtml
 * @return {String} The raw HTML content.
 */
Element.prototype.getInnerHtml = function(){
    return this.getAttribute("innerHTML");
};

//
// Abstract Members
//

/**
 * Dispatch an event.
 * @ignore
 * @abstract
 * @function module:screening/element.Element#dispatchEvent
 * @param {String} evtName The event to be fired, such as "mousedown", "click", etc.
 * @param {Object} params The parameters that will be set for the event, like "clientX", "keyIdentifier", etc.
 */

/**
 * Return the value specified element attribute.
 * @abstract
 * @function module:screening/element.Element#getAttribute
 * @param {String} attrName The attribute name to query.
 * @return {String} The attribute value.
 */

/**
 * Return the text content of the selected element.
 * @abstract
 * @function module:screening/element.Element#getInnerText
 * @return {String} The raw text content.
 */

/**
 * Tests to see if the value of an attribute on this element is equal to the given value.
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#hasAttributeValue
 * @param {Array} attrib Attribute to test.
 * @param {Array} expectedValue Value to test against.
 * @return {Boolean} True is the attribute value is equal to expectedValue.
 */

/**
 * The execution of this function will fail after either the given timeout<br>
 * or the "timeout" option.
 * @abstract
 * @function module:screening/element.Element#waitForAttributeValue
 * @param {String} attributeName The attribute name that we expect to have a certain value.
 * @param {String} expectedAttributeValue The attribute value we wait for.
 * @param {Integer} maxTimeout The max time in milliseconds to wait for the value to be as expected.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Wait for the given attribute of the current element to change to a different value<br>
 * than the initial one. Right after this function is called the current attribute value<br>
 * is read and this function waits for the attribute's vaue to change.<br>
 * The execution of this function will fail after either the given timeout<br>
 * or the "timeout" option.
 * @abstract
 * @function module:screening/element.Element#waitForAttributeChange
 * @param {String} attributeName The attribute name that we expect to have a certain value.
 * @param {String} expectedAttributeValue The attribute value we wait for.
 * @param {Integer} maxTimeout The max time in milliseconds to wait for the value to be as expected.
 */

/**
 * Get the scroll offset of the current element, this only applies to scrollable elements.
 * @abstract
 * @function module:screening/element.Element#getScroll
 * @returns {Array} Returns an array of the x and y scroll offset of the current element, like so [100, 0].
 */

/**
 * Scroll the current element to the given position, this only works to scrollable elements.
 * @abstract
 * @function module:screening/element.Element#setScroll
 * @param {Integer} x The offset to scroll by the x position.
 * @param {Integer} y The offset to scroll by the y position.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Set the scroll offset of the current element; this only works to scrollable elements.
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#setScrollBy
 * @param {Integer} x The offset to scroll by the x position.
 * @param {Integer} y The offset to scroll by the y position.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Set the scroll offset of the current element; this only works to scrollable elements.
 * @abstract
 * @function module:screening/element.Element#setAttribute
 * @param {String} attrName Element attribute to change.
 * @param {String} attrValue Value to change the attribute to.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Gets the selectedIndex of a select element.
 * @abstract
 * @function module:screening/element.Element#getSelectedIndex
 * @return {Integer} selectedIndex
 */

/**
 * Set the selectedIndex of a select element.
 * @abstract
 * @function module:screening/element.Element#setSelectedIndex
 * @param {Integer} selectedIndex Index of option to select.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Gets the value of the selected option of a select element.
 * @abstract
 * @function module:screening/element.Element#getSelectedValue
 * @return {String} Selected option value
 */

/**
 * Selects the option within a select that has the spectified value.
 * @abstract
 * @function module:screening/element.Element#setSelectedValue
 * @param {String} selectedValue Value of option to select.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Gets the text content of the element. If the element is an input, returns<br>
 * the input value, otherwise returns the innerText of the element.
 * @abstract
 * @function module:screening/element.Element#getText
 * @return {String} The text of the element.
 */

/**
 * Gets the computed style of the given style property for this element.
 * @abstract
 * @function module:screening/element.Element#getComputedStyle
 * @param {String} styleProp Element style property to evaluate.
 * @return {String} The computed style value.
 */

/**
 * Gets wether or not the element is visible.
 * @abstract
 * @function module:screening/element.Element#isVisible
 * @return {Boolean} True if the element is visible.
 */

/**
 * Gets wether or not the element is enabled.
 * @abstract
 * @function module:screening/element.Element#isEnabled
 * @return {Boolean} True if the element is enabled.
 */

/**
 * Gets whether or not the element currently has keyboard focus.
 * @abstract
 * @function module:screening/element.Element#isFocused
 * @return {Boolean} True if the element has keyboard focus.
 */

/**
 * Gets the checked state of checkbox elements.
 * @abstract
 * @function module:screening/element.Element#getChecked
 * @return {Boolean} True if the element's "checked" attribute is true.
 */

/**
 * Description TODO - Do you want this to appear in the JSDoc rendering?????
 * @abstract
 * @function module:screening/element.Element#isChecked
 */

/**
 * Give focus to this element if it accepts focus.
 * @abstract
 * @function module:screening/element.Element#focus
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Press down the left mouse button at the given coordinate.
 * @function module:screening/element.Element#mouseDown
 * @param {Number} x X coordinate relative to the element's left side
 * @param {Number} y Y coordinate relative to the element's top
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Release the left mouse button at the given coordinate.
 * @abstract
 * @function module:screening/element.Element#mouseUp
 * @param {Number} x X coordinate relative to the element's left side.
 * @param {Number} y Y coordinate relative to the element's top.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Perform a mouse move or series of mouse moves.
 * @abstract
 * @function module:screening/element.Element#mouseMove
 * @param {Number|Array} x X coordinate or An array of points to move the moust between.
 * @param {Number} y Y coordinate.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Perform a click on the element.
 * @abstract
 * @function module:screening/element.Element#click
 * @param {Number} button Optional Mouse button.
 * @param {Number} x Optional X coordinate.
 * @param {Number} y Optional Y coordinate.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Alias for "click".
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#mouseClick
 */

/**
 * Perform a double left-click on the element.
 * @abstract
 * @function module:screening/element.Element#doubleClick
 * @param {Number} x Optional X coordinate.
 * @param {Number} y Optional Y coordinate.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * These are multiple key strokes executes after one another;<br>
 * the keys to press can be given as a string, e.g.,<br>
 *   <code>browser.execute('#search').sendKeys('uxebu');</code>
 * @abstract
 * @function module:screening/element.Element#sendKeys
 * @param {String} inputString The input string.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Press a single finger to the screen at the given coordinates.
 * @abstract
 * @function module:screening/element.Element#touchStart
 * @param {Number} x X coordinate relative to the element's left side.
 * @param {Number} y Y coordinate relative to the element's top.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Remove a single finger from the screen at the given coordinates.
 * @abstract
 * @function module:screening/element.Element#touchEnd
 * @param {Number} x X coordinate relative to the element's left side.
 * @param {Number} y Y coordinate relative to the element's top.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Move a single, depressed finger to the given coordinates.
 * @abstract
 * @function module:screening/element.Element#touchMove
 * @param {Number} x X coordinate relative to the element's left side.
 * @param {Number} y Y coordinate relative to the element's top.
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Tap the element with a single finger.
 * @abstract
 * @function module:screening/element.Element#touchClick
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Tap the element twice with a single finger.
 * @abstract
 * @function module:screening/element.Element#touchDoubleClick
 * @return {Element} A reference to this, to allow chaining.
 */

/**
 * Long press the element with a single finger.
 * @abstract
 * @function module:screening/element.Element#touchLongClick
 * @return {Element} A reference to this, to allow chaining.
 */

//
// Deprecated Members
// TODO: Old API compatibility, remove
// 
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#setScrollTo
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#mousedown
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#mouseup
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#mousemove
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#mouseMoves
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keypress
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keyPress
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keyPresses
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#touchstart
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#touchend
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#touchmove
 */

/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keyDown
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keydown
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keyUp
 */
/**
 * @deprecated
 * @abstract
 * @function module:screening/element.Element#keyup
 */

//-------------------------------------------------------------------------
//=========================================================================
//-------------------------------------------------------------------------

/**
 * @class module:screening/element.ElementArray
 * @classdesc This is just an extension of Element, and we can add methods if we need to.
 */
var ElementArray = exports.ElementArray = function(agent, elements){
    this.agent = agent;
    this.sync = agent ? agent.sync : null;
    this.result = (agent ? agent.result : null);
    for(var i in elements) {
        var element = elements[i];
        this.push(new Element(agent, element));
    }
};

/**
 * Description TODO
 * @function module:screening/element.ElementArray#prototype
 */
ElementArray.prototype = [];

/**
 * Get the number of nodes that have been selected by <code>agent.elements()</code>.<br>
 * To be used i.e. like this:<br>
 *   <code>agent.elements('.className').getCount();</code><br>
 * All return values on <code>elements()</code> return an <code>array</code>, so in assert you need to<br>
 * compare to an <code>array</code>.
 * @deprecated
 * @function module:screening/element.ElementArray#getCount
 * @returns {Integer} The number of elements/nodes found.
 */
ElementArray.prototype.getCount = Warning.deprecateApi(function(){
    return this.length;
}, "getCount", "Please use the length property instead.");

/**
 * Retrieves the element at the given index.
 * @deprecated
 * @function module:screening/element.ElementArray#getItem
 * @param {Integer} index Index to retrieve.
 * @returns {Element} Element at the given index.
 */
ElementArray.prototype.getItem = Warning.deprecateApi(function(index){
    return this[index];
}, "getItem", "Please use the array index operator, [], instead.");
