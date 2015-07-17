/**
 * @module ui/batch-step-variables-summary.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BatchStepVariablesSummary
 * @extends Component
 */
exports.BatchStepVariablesSummary = Component.specialize(/** @lends BatchStepVariablesSummary# */ {
    constructor: {
        value: function BatchStepVariablesSummary() {
            this.super();
        }
    },

    hasTemplate: {
        value: false
    },

    variables: {
        value: null
    },
    
    draw: {
        value: function() {
            var self = this;
            var parent = this.element;

            // Start by clearing the entire element
            while (parent.lastChild) {
                parent.removeChild(parent.lastChild);
            }

            if (this.variables && this.variables.length > 0) {
                // Helper function for creating and appending elements
                function el(innerHtml) {
                    var el_ = document.createElement("SPAN");
                    el_.innerHTML = innerHtml || el_.innerHTML;
                    parent.appendChild(el_);

                    return el_;
                }



                el("with ");

                this.variables.forEach(function(variable, index) {
                    el(variable.name).classList.add("variableName");

                    el(" as ");

                    el('"' + variable.value + '"').classList.add("variableValue");

                    if (index < self.variables.length - 1) {
                        el(", ")
                    } else {
                        // Add spacing at the end so the final italicized value does not get clipped
                        var spaceEl = el();
                            spaceEl.style.display = "inline-block";
                            spaceEl.style.width = "2px";
                    }
                });
            }
        }
    }
});
