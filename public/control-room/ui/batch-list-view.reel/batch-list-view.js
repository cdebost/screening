/**
 * @module ui/batch-list-view.reel
 */
var Component = require("montage/ui/component").Component,
    BatchSource = require("core/batch-source").BatchSource;

/**
 * @class BatchListView
 * @extends Component
 */
exports.BatchListView = Component.specialize(/** @lends BatchListView# */ {
    constructor: {
        value: function BatchListView() {
            this.super();
        }
    },

    batchController: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.queryBatchSources();

            document.addEventListener("batchDeleted", function() {
                self.deleteBatch();
                self.batchController.selectedObjects = [];
                self.batchController.selectedIndexes = [];
            });

            this.application.addEventListener("scriptSaved", function() {
                // Reload, there could have been a change of variables in the saved script
                // that affects one or more batches
                self.queryBatchSources();
            })
        }
    },

    queryBatchSources: {
        value: function() {
            var self = this;

            var url = "/screening/api/v1/batches?api_key=5150";

            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.onload = function() {
                var lastBatchId = localStorage["Screening.AppState.CurrentBatch"];
                self.batchController.content = [];
                var sources = JSON.parse(this.responseText);
                var selectedBatch = null;
                var selectedBatchIndex = null;
                var batchSources = [];
                for (var i in sources) {
                    if (sources.hasOwnProperty(i)) {
                        var batchSource = BatchSource.create();
                        batchSource.fromServer(sources[i]);
                        batchSources.push(batchSource);

                        // We want to select a batch if one was passed in or
                        // if we have stored one in localStorage. Passed in name
                        // gets the preference between the two. Hopefully this logic
                        // does that.
                        //if (scriptName && scriptName === scriptSource.name) {
                        //    selectedScript = scriptSource;
                        //    selectedScriptIndex = i;
                        //}

                        if (!selectedBatch /*&& !scriptName*/ && lastBatchId == batchSource.id) {
                            selectedBatch = batchSource;
                            selectedBatchIndex = i;
                        }
                    }
                }
                self.batchController.content = batchSources;

                if (selectedBatch && selectedBatchIndex) {
                    self.batchController.selectedObjects = selectedBatch;
                    self.batchController.selectedIndexes = [selectedBatchIndex];
                    self.batchController.selection.clear();
                }
            };
            req.send(null);
        }
    },

    _createNewBatch: {
        value: function() {
            var self = this;

            var req = new XMLHttpRequest();
            req.open("POST", "/screening/api/v1/batches/?api_key=5150", true);
            req.onload = function() {
                var createdBatch = JSON.parse(this.responseText);

                // Create a proper BatchSource object and then populate it with the response
                var batchSource = new BatchSource();
                batchSource.fromServer(createdBatch);

                self.batchController.add(batchSource);
                self.needsDraw = true;
            };
            req.send(null);
        }
    },

    deleteBatch: {
        value: function() {
            this.batchController.delete(this.batchController.selection[0]);
            this.needsDraw = true;
        }
    },

    // Button Methods
    handleNewBatchButtonAction: {
        value: function() {
            if (this.delegate && this.delegate.canAddNewItem) {
                this.delegate.canAddNewItem(this._createNewBatch.bind(this));
            } else {
                this._createNewBatch();
            }
        }
    }
});
