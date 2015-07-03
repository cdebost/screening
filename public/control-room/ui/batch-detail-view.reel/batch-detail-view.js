/**
 * @module ui/batch-detail-view.reel
 */
var Component = require("montage/ui/component").Component,
    PreferenceManager = require("core/preference-manager").PreferenceManager,
    Confirm = require("matte/ui/popup/confirm.reel").Confirm;

/**
 * @class BatchDetailView
 * @extends Component
 */
exports.BatchDetailView = Component.specialize(/** @lends BatchDetailView# */ {
    constructor: {
        value: function BatchDetailView() {
            this.super();
        }
    },

    batchNameField: {
        value: null,
        enumerable: false
    },

    runButton: {
        value: null,
        enumerable: true
    },

    deleteButton: {
        value: null,
        enumerable: true
    },

    _batchSource: {
        enumerable: false,
        value: null,
        writable: true
    },

    batchSource: {
        get: function() {
            return this._batchSource;
        },
        set: function(value) {
            if (value) {
                if (!value) {
                    this._batchSource = null;
                    return;
                }

                if (value !== this.batchSource) {
                    this._batchSource = value;
                }

            }
        }
    },

    batchUI: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.addPathChangeListener("batchSource", function (newBatch) {
                self.batchNameField.element.disabled /*= self.scriptTags.element.disabled*/ = !self.batchSource;

                if (self.batchSource) {
                    self.runButton.disabled = false;
                    self.deleteButton.disabled = false;
                }

                // Show/hide the empty detail
                if (newBatch) {
                    this.emptyDetail.style.display = "none";
                    localStorage["Screening.AppState.CurrentBatch"] = newBatch.id;
                } else {
                    this.emptyDetail.style.display = "table";
                    this.clearFields();
                }

                if (newBatch) {
                    self.batchUI.loadBatch(newBatch);
                }
            }, false);

            // Save the batch when its name is changed
            this.batchNameField.addPathChangeListener("value", function (event) {
                if (event && self.batchSource && self.batchSource.name !== self.batchNameField.value) {
                    // Save if the name has not changed in one second
                    setTimeout(function(lastInput) {
                        if (self.batchSource.name === self.batchNameField.value) {
                            return;
                        }

                        if (lastInput === self.batchNameField.value) {
                            self.saveBatch();
                        }
                    }, 1000, self.batchNameField.value);
                }
            }, false);

            // Mark the script as needing a save when the tags are changed
            //this.scriptTags.addPathChangeListener("value", function (event) {
            //    if (event && self.scriptSource && self.scriptSource.displayTags !== self.scriptTags.value) {
            //        self.needsSave = true;
            //    }
            //}, false);

            //TODO overwritten by script keydown listener
            document.addEventListener("keydown", this);
        }
    },

    handleKeydown: {
        value: function(event) {
            if (event.keyCode == 'S'.charCodeAt(0)) {
                if (event.metaKey) { // OSX save
                    this.saveBatch();
                    event.preventDefault();
                } else if (event.ctrlKey) { // Windows/Linux save
                    this.saveBatch();
                    event.preventDefault();
                }
            }
        }
    },

    runBatch: {
        value: function() {
            var self = this;

            if (!self.activeAgents || self.activeAgents.length < 1) {
                Alert.show("You must select at least one agent from the list to run the batch.");
                return;
            }

            if (window.webkitNotifications) {
                window.webkitNotifications.requestPermission(run);
            } else {
                run();
            }

            function run() {
                var agentCount = self.activeAgents.length;
                for (var i = 0; i < agentCount; ++i) {
                    var agent = self.activeAgents[i];
                    var req = new XMLHttpRequest();
                    req.open("POST", "/screening/api/v1/agents/" + agent.info.id +
                        "/execute_batch/" + self.batchSource.id + "?api_key=5150", true);
                    req.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                    var requestBody = {
                        preferences: PreferenceManager.getPreferences()
                    };
                    // TODO do something with requestBody
                    req.send(null);
                }
            }
        }
    },

    saveBatch: {
        value: function() {
            // update the code
            var id = this.batchSource.id;
            if (this.batchNameField.value) {
                this.batchSource.name = this.batchNameField.value;
            }
            //this.batchSource.displayTags = this.scriptTags.value;
            this.batchSource.displayTags = "";

            var scripts = this.templateObjects.stepsRangeController.content.map(function(step) {
                return {
                    name: step.scriptName
                }
            });

            var self = this;

            var req = new XMLHttpRequest();
            req.open("PUT", "/screening/api/v1/batches/" + id + "?api_key=5150", true);
            req.onload = function(event) {
                if (event.target.status === 500) {
                    try {
                        var res = JSON.parse(event.target.responseText);
                        var resError = JSON.parse(res.error);
                        // Error codes from: http://www.mongodb.org/display/DOCS/Error+Codes duplicate keys
                        if (resError.lastErrorObject.code === 11000 || resError.lastErrorObject.code === 11001) {

                            Alert.show("The batch name '" + self.batchSource.name + "' already exists. Please choose a different name.");
                        } else {
                            Alert.show("Unknown error trying to save batch:" + resError.lastErrorObject.code);
                        }
                    } catch(err) {
                        Alert.show("Unknown error trying to save batch: " + err);
                    }
                }
                self.needsDraw = true;
            };
            req.setRequestHeader("Content-Type", "application/json");

            //// Parse tags
            //var str = self.scriptTags.value;
            //var tags = str.match(/\w+|"[^"]+"/g);
            //// Remove quotes
            //
            //if (tags) {
            //    tags.forEach(function(elem, index) {
            //        tags[index] = tags[index].replace(/"/g, "");
            //    });
            //}

            var reqBody = {
                name: self.batchSource.name,
                code: self.batchSource.code,
                scripts: scripts
                //tags: tags
            }
            req.send(JSON.stringify(reqBody));
        }
    },

    addBatchStep: {
        value: function() {
            this.batchUI.add();
        }
    },

    deleteBatch: {
        value: function() {
            var self = this;
            Confirm.show("Are you sure you want to delete this batch?", function() {
                // OK
                var req = new XMLHttpRequest();
                req.open("DELETE", "/screening/api/v1/batches/" + self.batchSource.id + "?api_key=5150", true);
                req.onload = function(event) {
                    self._dispatchDeleted();
                };
                req.send(null);
            }, function() {
                // Cancel
                // Do nothing for now
            });
        }
    },

    _dispatchDeleted: {
        value: function() {
            var event = document.createEvent("CustomEvent");
            event.initCustomEvent("batchDeleted", true, false);
            event.batch = this.batchSource;
            document.dispatchEvent(event);

            this.clearFields();
        }
    },

    clearFields: {
        /**
         * Clear the script name, tags and content.
         */
        value: function() {
            this.batchNameField.value = "";
            //this.scriptTags.value = "";

            // Disable the Save, Run, etc buttons
            this.runButton.disabled = true;
            this.deleteButton.disabled = true;
        }
    }
});
