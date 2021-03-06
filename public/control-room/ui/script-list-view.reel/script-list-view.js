/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */

/**
 * @module ui/script-list-view.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    ScriptSource = require("core/script-source").ScriptSource;

/**
 * @class ScriptListView
 * @extends Component
 */
exports.ScriptListView = Component.specialize({
    constructor: {
        value: function ScriptListView() {
            this.super();
        }
    },

    scriptController: {
        value: null
    },

    scriptDetail: {
        value: null
    },

    scriptUploader: {
        value: null,
        serializable: true
    },

    scriptList: {
        value: null,
        serializable: true
    },

    isScriptListEmpty: {
        dependencies: ["scriptController.content"],
        get: function() {
            return !this.scriptController.content || this.scriptController.content.length === 0;
        }
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.queryScriptSources();
            this.scriptUploader.addEventListener('uploadEvent', this, false);

            document.addEventListener("scriptDeleted", function() {
                self.deleteScript();
                self.scriptController.selectedObjects = [];
                self.scriptController.selectedIndexes = [];
            });
        }
    },

    handleRefreshScriptList: {
        value: function(event) {
            this.queryScriptSources(null, event.searchScope, event.searchString);
        }
    },

    handleUploadEvent: {
        value: function(event) {
            this.queryScriptSources(event.script.name);
        }
    },

    queryScriptSources: {
        value: function(scriptName, searchScope, searchString) {
            var self = this;

            var url = "/screening/api/v1/scripts?api_key=5150";

            if (searchString && searchString.trim()) {
                if (searchScope && searchScope === "tags") {
                    // Parse tags: tag "multi word" -> tag, multi word
                    var tags = searchString.match(/\w+|"[^"]+"/g);
                    if (tags) {
                        tags.forEach(function(elem, index) {
                            tags[index] = tags[index].replace(/"/g, "");
                        });
                    }
                    tags = tags.join(",");
                    url += "&tags=" + encodeURIComponent(tags);
                } else if (searchScope && searchScope === "name") {
                    url += "&name_search=" + encodeURIComponent(searchString);
                }
            }

            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.onload = function() {
                var lastScriptId = localStorage["Screening.AppState.CurrentScript"];
                self.scriptController.content = [];
                var sources = JSON.parse(this.responseText);
                var selectedScript = null;
                var selectedScriptIndex = null;
                var scriptSources = [];
                for (var i in sources) {
                    if (sources.hasOwnProperty(i)) {
                        var scriptSource = ScriptSource.create();
                        scriptSource.fromServer(sources[i]);
                        scriptSources.push(scriptSource);

                        // We want to select a script if one was passed in or
                        // if we have stored one in localStorage. Passed in name
                        // gets the preference between the two. Hopefully this logic
                        // does that.
                        if (scriptName && scriptName === scriptSource.name) {
                            selectedScript = scriptSource;
                            selectedScriptIndex = i;
                        }

                        if (!selectedScript && !scriptName && lastScriptId == scriptSource.id) {
                            selectedScript = scriptSource;
                            selectedScriptIndex = i;
                        }
                    }
                }
                self.scriptController.content = scriptSources;

                if (selectedScript && selectedScriptIndex) {
                    self.scriptController.selectedObjects = selectedScript;
                    self.scriptController.selectedIndexes = [selectedScriptIndex];
                }
            };

            // If the script editor contents have changed then prompt the user
            if (self.scriptDetail && self.scriptDetail.needsSave) {
                self.scriptDetail.unsavedChangesConfirm(function() {
                    req.send(null);
                });
            } else {
                req.send(null);
            }
        }
    },

    _createNewScript: {
        value: function() {
            var self = this;

            var req = new XMLHttpRequest();
            req.open("POST", "/screening/api/v1/scripts/?api_key=5150", true);
            req.onload = function() {
                var createdScript = JSON.parse(this.responseText);

                // Create a proper ScriptSource object and then populate it with the response
                var scriptSource = new ScriptSource();
                scriptSource.fromServer(createdScript);

                self.scriptController.add(scriptSource);
                self.needsDraw = true;
            };
            req.send(null);
        }
    },

    deleteScript: {
        value: function() {
            this.scriptController.delete(this.scriptController.selection[0]);
            this.needsDraw = true;
        }
    },

    // Button Methods
    handleNewScriptButtonAction: {
        value: function() {
            if (this.delegate && this.delegate.canAddNewItem) {
                this.delegate.canAddNewItem(this._createNewScript.bind(this));
            } else {
                this._createNewScript();
            }
        }
    },

    handleDownloadAllButtonAction: {
        value: function() {
            window.location.href = "/screening/api/v1/scripts/archive?api_key=5150";
        }
    }
});
