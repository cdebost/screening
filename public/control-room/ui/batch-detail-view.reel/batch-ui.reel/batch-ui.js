/**
 * @module ui/batch-detail-view.reel/batch-ui.reel
 */
var Component = require("montage/ui/component").Component,
    Popup = require ("matte/ui/popup/popup.reel").Popup;

/**
 * @class BatchUi
 * @extends Component
 */
exports.BatchUi = Component.specialize(/** @lends BatchUi# */ {
    constructor: {
        value: function BatchUi() {
            this.super();
        }
    },

    steps: {
        value: null
    },

    batchStepDialog: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.batchStepDialog.addEventListener("message.ok", function(ev) {
                self._addBatchItem(ev.detail.scriptName);

                self.saveBatch();
            });

            this.addEventListener("moveStepUp", function(ev) {
                var index = self.steps.content.indexOf(ev.detail.step);

                if (index === 0) {
                    return;
                }

                self.steps.delete(ev.detail.step);
                self.steps.content.splice(index-1, 0, ev.detail.step);

                self.saveBatch();
            }, false);

            this.addEventListener("moveStepDown", function(ev) {
                var index = self.steps.content.indexOf(ev.detail.step);

                if (index === self.steps.content.length - 1) {
                    return;
                }

                self.steps.delete(ev.detail.step);
                self.steps.content.splice(index+1, 0, ev.detail.step);

                self.saveBatch();
            }, false);

            this.addEventListener("configStep", function(ev) {


                self.saveBatch();
            }, false);

            this.addEventListener("deleteStep", function(ev) {
                self.steps.delete(ev.detail.step);

                self.saveBatch();
            }, false);
        }
    },

    loadBatch: {
        value: function(batch) {
            if (this.steps.content) {
                this.steps.clear();
            }

            var self = this;

            if (batch.scripts) {
                batch.scripts.forEach(function (script) {
                    self._addBatchItem(script.name);
                });
            }
        }
    },

    saveBatch: {
        value: function() {
            this.parentComponent.saveBatch();
        }
    },

    add: {
        value: function() {
            var popup = Popup.create();
            popup.content = this.batchStepDialog; // the content inside the Popup
            popup.modal = true;
            popup.show();
        }
    },

    _addBatchItem: {
        value: function(name) {
            this.steps.addContent();
            var steps = this.steps.content;
            var newStep = steps[steps.length - 1];
            newStep.scriptName = name;
        }
    }
});
