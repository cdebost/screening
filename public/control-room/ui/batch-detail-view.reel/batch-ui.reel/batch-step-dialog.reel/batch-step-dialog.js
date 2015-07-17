/**
 * @module ui/batch-step-dialog.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class BatchStepDialog
 * @extends Component
 */
exports.BatchStepDialog = Component.specialize(/** @lends BatchStepDialog# */ {
    constructor: {
        value: function BatchStepDialog() {
            this.super();
        }
    },

    headerLabel: {
        value: null
    },

    scripts: {
        value: null
    },
    
    enterDocument: {
        value: function() {
            var self = this;

            var url = "/screening/api/v1/scripts?api_key=5150";

            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.onload = function() {
                if (self.scripts.content) {
                    self.scripts.clear();
                }

                var sources = JSON.parse(this.responseText);
                sources.forEach(function(source) {
                    self.scripts.add(source);
                });

                self.headerLabel.value = "Select a script:";
            };
            req.send(null);
        }
    },

    handleOkAction: {
        value: function() {
            var ev = document.createEvent("CustomEvent");
            ev.initCustomEvent("message.ok", true, true, {script: this.scripts.selection[0]});
            this.dispatchEvent(ev);
            this.popup.hide();
        }
    },

    handleCancelAction: {
        value: function() {
            this.popup.hide();
        }
    }
});
