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

    handleDeleteButtonAction: {
        value: function() {
            this.parentComponent.dispatchEventNamed("deleteStep", true, false, {step: this.step});
        }
    }
});
