/**
 * @module ui/variable-view.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class VariableView
 * @extends Component
 */
exports.VariableView = Component.specialize(/** @lends VariableView# */ {
    constructor: {
        value: function VariableView() {
            this.super();
        }
    },

    name: {
        value: null
    },

    defaultValue: {
        value: null
    },

    handleDeleteButtonAction: {
        value: function() {
            this.parentComponent.parentComponent.dispatchEventNamed("deleteVariable", false, false, {name: this.name});
        }
    }
});
