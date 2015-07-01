/**
 * @module ui/batch-source-view.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BatchSourceView
 * @extends Component
 */
exports.BatchSourceView = Component.specialize(/** @lends BatchSourceView# */ {
    constructor: {
        value: function BatchSourceView() {
            this.super();
        }
    },

    _batchSource: {
        enumerable: false,
        value: null
    },

    batchSource: {
        get: function() {
            return this._batchSource;
        },
        set: function(value) {
            this._batchSource = value;
        }
    }
});
