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
var Component = require("montage/ui/component").Component,
    Alert = require ("matte/ui/popup/alert.reel").Alert;

exports.ScriptResultsView = Component.specialize({
    _results: {
        enumerable: false,
        value: []
    },

    _pageSize: {
        enumerable: false,
        value: 10
    },

    _currentPage: {
        enumerable: false,
        value: 1
    },

    _totalPages: {
        enumerable: false,
        value: undefined
    },

    _baseResultsUrl : {
        enumerable: false,
        value: "/screening/api/v1/test_results?api_key=5150"
    },

    selectAllButton: {
        serializable: true,
        enumerable: false,
        value: null
    },

    currentPageTextField: {
        serializable: true,
        enumerable: false,
        value: null
    },

    previousPageButtonTop: {
        serializable: true,
        enumerable: false,
        value: null
    },

    nextPageButtonTop: {
        serializable: true,
        enumerable: false,
        value: null
    },

    scriptResultsSearch: {
        serializable: true,
        enumerable: false,
        value: null
    },

    results: {
        enumerable: true,
        get: function() {
            return this._results;
        },
        set: function(value) {
            this._results = value;
        }
    },

    pageSize: {
        enumerable: true,
        get: function() {
            return this._pageSize;
        },
        set: function(value) {
            this._pageSize = value;
        }
    },

    currentPage: {
        enumerable: true,
        get: function() {
            return this._currentPage;
        },
        set: function(value) {
            value = parseInt(value);

            this._currentPage = value >= 1 ? value : 1;

            var resultsUrl = this._baseResultsUrl;
            if(this.scriptResultsSearch && this.scriptResultsSearch.resultsSearchBox && this.scriptResultsSearch.resultsSearchBox.value) {
                resultsUrl += "&any=" + this.scriptResultsSearch.resultsSearchBox.value;
            }

            this.renderResults(resultsUrl);

            // Disable/Enable page buttons if we are on the first/last pages
            if ([
                    this.templateObjects,
                    this.templateObjects.previousPageButtonTop,
                    this.templateObjects.nextPageButtonTop
                ].all()) {
                this.templateObjects.previousPageButtonTop.element.disabled = (this._currentPage === 1);
                this.templateObjects.nextPageButtonTop.element.disabled = (this._currentPage === this._totalPages);
            }
        }
    },

    totalPages: {
        enumerable:true,
        get: function() {
            return this._totalPages;
        },
        set: function(value) {
            this._totalPages = parseInt(value);

            this.templateObjects.currentPage.element.setAttribute("max", this._totalPages);
        }
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            self.calculateTotalPages(null, function() {
                self.currentPage = 1;
            });
        }
    },

    isAtLeastOneSelected: {
        value: function() {
            var self = this;

            return self._results.some(function(elem) {
                return elem.selected;
            });
        }
    },

    selectedResults: {
        value: function() {
            var self = this;

            var selRes = [];
            self._results.forEach(function(elem, i) {
                if (elem.selected) {
                    selRes.push({index: i, object: elem});
                }
            });
            return selRes;
        }
    },

    deleteResults: {
        value: function(event) {
            // Verify that at least one element is selected
            var atLeastOneSelected = this.isAtLeastOneSelected();
            if (!atLeastOneSelected) {
                Alert.show("You must select at least one Testcase result to delete.");
                return;
            }

            var selectedResults = this.selectedResults();

            var ids = selectedResults.map(function(elem) {
                return elem.object.id;
            });

            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", "/screening/api/v1/test_results/multiple?api_key=5150");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify({
                ids: ids
            }));

            var self = this;
            xhr.addEventListener("load", function(evt) {
                var offset = 0;
                for (var res in selectedResults) {
                    self.templateObjects.resultDetailsRepetition.content.splice(selectedResults[res].index - offset, 1);
                    offset++;
                }
                
                for (var i in self.templateObjects.resultDetailsRepetition.content) {
                    self.templateObjects.resultDetailsRepetition.content[i].selected = false;
                }
            });
        }
    },

    resultSelected: {
        value: function(event) {
            var selectedStatus = this.isAtLeastOneSelected();

            this.templateObjects.selectAllBtn.label = selectedStatus ? "Deselect All" : "Select All";
        }
    },

    selectAllResults: {
        value: function(event) {
            var selectedStatus = !this.isAtLeastOneSelected();

            this._results.forEach(function(elem, i) {
                elem.selected = selectedStatus;
            });

            this.resultSelected(event);
        }
    },

    nextPage: {
        value: function(event) {
            var self = this;

            self.currentPage = self._currentPage < self._totalPages ? self._currentPage + 1 : self._totalPages;
        }
    },

    previousPage: {
        value: function(event) {
            var self = this;

            self.currentPage = self.currentPage == 1 ? 1 : self.currentPage - 1;
        }
    },

    handleRefreshResults: {
        value: function(event) {
            var self = this;

            self.calculateTotalPages(event.searchString, function() {
                self.currentPage = 1;
            });
        }
    },

    renderResults: {
        value: function(testResultsUrl) {
            var self = this;
            var xhr = new XMLHttpRequest();

            // Clear all the results from the table
            while (self._results.pop()) {}

            // Add pagination support
            testResultsUrl += "&limit=" + self._pageSize + "&skip=" + ((self._currentPage - 1) * self._pageSize);

            xhr.onload = function(event) {
                // Parse the response from /test_results
                var data = JSON.parse(event.target.responseText);

                data.forEach(function (res) {
                    self._results.push({
                        selected: false,
                        id: res._id,
                        name: res.name,
                        agent: res.agent,
                        script: res.testcase.name,
                        summary: res.status,
                        startTime: res.startTime,
                        endTime: res.endTime,
                        resultUrl: "script-result.html?" + res._id
                    });
                });
            };

            xhr.open("GET", testResultsUrl);
            xhr.send();
        }
    },

    calculateTotalPages: {
        value: function(searchString, cb) {
            var self = this;

            var metadataUrl = "/screening/api/v1/test_results/metadata?api_key=5150"
            if(searchString) {
                metadataUrl += "&any=" + searchString;
            }

            var xhr = new XMLHttpRequest();
            xhr.onload = function(event) {
                var data = JSON.parse(event.target.responseText);

                self.totalPages = Math.ceil(data.count / self.pageSize);
                cb();
            };
            xhr.open("GET", metadataUrl);
            xhr.send();
        }
    }
});
