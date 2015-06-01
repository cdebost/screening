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
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    AgentBrowser = require("core/agent-browser").AgentBrowser;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    socket: {
        value: null
    },

    agents: {
        value: null,
        serializable: true
    },

    activeAgents: {
        value: null
    },

    selectedAgent: {
        value: null
    },

    scriptSource: {
        value: null
    },

    serverVersion: {
        value: ""
    },

    scripts: {
        value: null,
        serializable: true
    },

    scriptDetail: {
        value: null,
        serializable: true
    },

    scriptList: {
        value: null,
        serializable: true
    },

    emptyDetail: {
        value: null,
        serializable: true
    },

    templateDidLoad: {
        value: function() {
            this.init();
        }
    },

    init: {
        enumerable: false,
        value: function() {
            var self = this;

            // Confirm navigation away from Control Room if there's an unsaved script
            window.onbeforeunload = function() {
                var navigateAwayMessage = "Your changes to the script have not been saved yet.";

                return self.scriptDetail.needsSave ? navigateAwayMessage : null;
            }

            // Make this class visible to the scripts list delegate
            if (this.scripts.delegate) {
                this.scripts.delegate.scriptManager = this;
            }

            this.scriptDetail.addPathChangeListener("scriptSource", function(newScript) {
                self.scriptChanged(newScript);
            }, false);

            this.scriptDetail.addPathChangeListener("selectedAgent", function(newAgent) {
                self.selectedAgentChanged(newAgent);
            }, false);

            this.scriptDetail.addEventListener("scriptDeleted", function(event) {
                self.scriptList.deleteScript();
                self.scripts.selectedObjects = [];
                self.scripts.selectedIndexes = [];
                self.scriptChanged(null, null);
                self.scriptDetail.clearFields();
            }, false);

            this.socket = io("http://" + document.domain + ":" + document.location.port, { path: "/socket.io" });

            this._initDriver();

            this.socket.on("connect", function() {
                console.log("Connected to the Screening server");
            })

            this.socket.on("reconnect", function() {
                self._initDriver();
            });

            this.socket.on("agentConnected", function(agentInfo) {
                var agent = AgentBrowser.create();
                agent.info = agentInfo;
                self.agents.addObjects(agent);
            });

            this.socket.on("agentDisconnected", function(agentId) {
                var displayedAgents = self.agents.organizedObjects;
                for (var i = 0; i < displayedAgents.length; ++i) {
                    if (displayedAgents[i].info.id === agentId) {
                        self.agents.removeObjects(displayedAgents[i]);
                        return;
                    }
                }
            });

            this.socket.on("testStarted", function(agentId) {
                var agent = self.getAgentById(agentId);
                agent.testing = true;
                agent.clearLog();
            });

            this.socket.on("logMessage", function(agentId, log) {
                var agent = self.getAgentById(agentId);
                agent.log(log);
            });

            this.socket.on("testProgress", function(agentId, count, total) {
                var agent = self.getAgentById(agentId);
                agent.totalSteps = total;
                agent.stepsCompleted = count;
            });

            this.socket.on("testCompleted", function(agentId, testResult) {
                var agent = self.getAgentById(agentId);
                agent.testing = false;
                self.scriptDetail.lastTestResult = testResult;
                self.scriptDetail.showResult();
            });

            // Get the available agents
            this.socket.on("getAgents", function() {
                return this.agents;
            });
        }
    },

    _initDriver: {
        value: function() {
            var self = this;
            self.agents.content = []; // TODO: find a more elegant solution to do this.
            this.socket.emit("initDriver", function(version, agentsInfo, availableTests) {
                self.serverVersion = version;
                var newAgentsArray = [];
                for (var i in agentsInfo) {
                    var agent = AgentBrowser.create();
                    agent.info = agentsInfo[i];
                    newAgentsArray.push(agent);
                }
                self.agents.content = newAgentsArray;
            });
        }
    },

    // TODO: Yeah, this is stupid slow but I don't care at this exact moment.
    getAgentById: {
        value: function(agentId) {
            var displayedAgents = this.agents.content;
            
            for (var i = 0; i < displayedAgents.length; ++i) {
                var agent = displayedAgents[i];
                if (agent.info.id == agentId) {
                    return agent;
                }
            }
        }
    },

    scriptChanged: {
        /**
         *
         * @param {Script} newScript New Script
         * @param {Script} prevScript Previous Script
         */
        value: function(newScript) {
            if (!this.emptyDetail || !this.scriptDetail) {
                return;
            }

            if (newScript) {
                this.emptyDetail.style.display = "none";
                localStorage["Screening.AppState.CurrentScript"] = newScript.id;
            } else {
                this.emptyDetail.style.display = "table";
                this.scriptDetail.clearFields();
            }
        }
    },

    selectedAgentChanged: {
        value: function(newAgent) {
            if (!this.scriptDetail || !this.scriptDetail.recordButton) {
                //scriptDetail has not been fully loaded
                return;
            }

            if (newAgent && newAgent.info.capabilities.browserName !== "chrome") {
                this.scriptDetail.recordButton.element.disabled = true;
            } else  {
                this.scriptDetail.recordButton.element.disabled = false;
            }
        }
    }
});