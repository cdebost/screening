/**
 * @module ui/batch-step-view.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BatchStepView
 * @extends Component
 */
exports.BatchStepView = Component.specialize(/** @lends BatchStepView# */ {
    constructor: {
        value: function BatchStepView() {
            this.super();
        }
    },
    
    step: {
        value: null
    },

    variablesSummary: {
        value: null
    },

    configButton: {
        value: null
    },

    enterDocument: {
        value: function() {
            if (this.step.variables.length == 0) {
                this.configButton.classList.add("hidden");
            } else {
                this.configButton.classList.remove("hidden");
            }
        }
    },

    draw: {
        value: function() {
            this.variablesSummary.needsDraw = true;
        }
    },
    
    handleUpButtonAction: {
        value: function() {
            this.parentComponent.dispatchEventNamed("moveStepUp", true, false, {step: this.step});
        }
    },

    handleDownButtonAction: {
        value: function() {
            this.parentComponent.dispatchEventNamed("moveStepDown", true, false, {step: this.step});
        }
    },

    handleConfigButtonAction: {
        value: function() {
            var self = this;
            this.parentComponent.dispatchEventNamed("configStep", true, false, {step: this.step, repaint: function() {
                self.needsDraw = true;
            }});
        }
    },

    handleDeleteButtonAction: {
        value: function() {
            this.parentComponent.dispatchEventNamed("deleteStep", true, false, {step: this.step});
        }
    }
});
