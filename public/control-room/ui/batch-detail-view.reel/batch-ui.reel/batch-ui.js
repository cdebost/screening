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

    stepView: {
        value: null
    },

    batchStepDialog: {
        value: null
    },

    batchConfigDialog: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.batchStepDialog.addEventListener("message.ok", function(ev) {
                var script = ev.detail.script;
                    script.variables.forEach(function(variable) {
                        variable.value = variable.defaultValue;
                    });
                self._addBatchItem(script.name, script.variables);

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
                self.batchConfigDialog.step = ev.detail.step;
                self.batchConfigDialog.repaint = ev.detail.repaint;

                var popup = Popup.create();
                popup.content = self.batchConfigDialog;
                popup.modal = true;
                popup.show();
            }, false);

            this.batchConfigDialog.addEventListener("message.close", function() {
                self.saveBatch();
            });

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
                var req = new XMLHttpRequest();
                req.open("GET", "/screening/api/v1/scripts?api_key=5150", true);
                req.onload = function () {
                    var sources = JSON.parse(this.responseText);

                    // Create a dictionary that links script names to their variable definitions
                    var scriptVariableMap = {};
                    sources.forEach(function (source) {
                        scriptVariableMap[source.name] = source.variables;
                    });

                    batch.scripts.forEach(function (script) {
                        self._addBatchItem(script.name, script.variables);
                    });
                };
                req.send(null);
            }
        }
    },

    unload: {
        value: function() {
            if (this.steps.content) {
                this.steps.clear();
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
        value: function(name, variables) {
            this.steps.addContent();
            var steps = this.steps.content;
            var newStep = steps[steps.length - 1];
            newStep.scriptName = name;
            newStep.variables = variables;
            return newStep;
        }
    }
});
