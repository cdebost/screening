/**
 * @module ui/script-variables-prompt.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ScriptVariablesPrompt
 * @extends Component
 */
exports.ScriptVariablesPrompt = Component.specialize(/** @lends ScriptVariablesPrompt# */ {
    constructor: {
        value: function ScriptVariablesPrompt() {
            this.super();
        }
    },

    scriptSource: {
        value: null
    },

    variableController: {
        value: null
    },

    runButton: {
        value: null
    },

    cancelButton: {
        value: null
    },

    enterDocument: {
        value: function() {
            var self = this;

            this.scriptSource.variables.forEach(function(variable) {
                self.variableController.add({
                    name: variable.name,
                    value: variable.defaultValue
                });
            });
        }
    },

    exitDocument: {
        value: function() {
            this.variableController.clear();
        }
    },

    handleRunButtonAction: {
        value: function() {
            this.dispatchEventNamed("message.run", false, false, {variables: this.variableController.content});

            this.popup.hide();
        }
    },
    
    handleCancelButtonAction: {
        value: function() {
            this.popup.hide();
        }
    }
});
