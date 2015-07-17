/**
 * @module ui/batch-config-dialog.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BatchConfigDialog
 * @extends Component
 */
exports.BatchConfigDialog = Component.specialize(/** @lends BatchConfigDialog# */ {
    constructor: {
        value: function BatchConfigDialog() {
            this.super();
        }
    },

    step: {
        value: null
    },

    repaint: {
        value: null
    },

    variables: {
        value: null
    },

    redHint: {
        value: null
    },

    blueHint: {
        value: null
    },

    enterDocument: {
        value: function() {
            // Initialize our range controller from the step's variables array
            this.variables.clear();
            this.variables.addEach(this.step.variables);

            // Show/hide the appropriate hints
            var hasNewVariable = this.step.variables.some(function(variable) {
                return variable.new;
            });
            if (hasNewVariable) {
                this.blueHint.classList.remove("hidden");
            } else {
                this.blueHint.classList.add("hidden");
            }

            var hasStaleVariable = this.step.variables.some(function(variable) {
                return variable.stale;
            });
            if (hasStaleVariable) {
                this.redHint.classList.remove("hidden");
            } else {
                this.redHint.classList.add("hidden");
            }

        }
    },

    handleRemoveVariableAction: {
        value: function(ev) {
            // Remove the variable from the step's variables array
            for (var i = 0; i < this.step.variables.length; i++) {
                if (this.step.variables[i].name === ev.target.variableObj.name) {
                    this.step.variables.delete(this.step.variables[i]);
                    break;
                }
            }

            // Remove our local copy of the variable from the range controller
            this.variables.delete(ev.target.variableObj);
        }
    },

    handleCloseButtonAction: {
        value: function() {
            // Un-mark new variables, the user has seen them
            this.step.variables.forEach(function(variable) {
                variable.new = false;
            });

            this.dispatchEventNamed("message.close", false, false, {});

            this.repaint();

            this.popup.hide();
        }
    }
});
