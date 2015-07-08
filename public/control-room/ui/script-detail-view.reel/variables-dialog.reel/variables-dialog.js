/**
 * @module ui/variables-dialog.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class VariablesDialog
 * @extends Component
 */
exports.VariablesDialog = Component.specialize(/** @lends VariablesDialog# */ {
    constructor: {
        value: function VariablesDialog() {
            this.super();
        }
    },

    variablesController: {
        value: null,
        enumerable: true
    },

    closeButton: {
        value: null,
        enumerable: true
    },

    templateDidLoad: {
        value: function() {
            var self = this;

            this.addEventListener("deleteVariable", function(ev) {
                var content = self.variablesController.content;
                for (var i = 0; i < content.length; i++) {
                    if (content[i].name === ev.detail.name) {
                        self.variablesController.delete(content[i]);
                        break;
                    }
                }
            }, false);
        }
    },

    handleAddButtonAction: {
        value: function() {
            this.variablesController.add({name: "", defaultValue: ""});
        }
    },

    handleCloseButtonAction: {
        value: function() {
            var names = this.variablesController.content.map(function(varObj) {
                return varObj.name;
            });

            for (var i = 0; i < names.length; i++) {
                // Check that each variable name is valid
                if (!/^[A-Za-z_][A-Za-z0-9\-_]*$/.test(names[i])) {
                    return;
                }
            }

            // We can't close if there are two variables with the same name
            var noDupes = names.filter(function(name, index) {
                return names.indexOf(name) === index;
            });

            if (noDupes.length !== names.length) {
                return;
            }

            var ev = document.createEvent("CustomEvent");
            ev.initCustomEvent("message.close", true, true, {});
            this.dispatchEvent(ev);
            this.popup.hide();
        }
    }
});
