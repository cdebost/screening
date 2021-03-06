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
var path = require('path'),
    routingConfig = require("./routing-config.js"),
    express = require('express'),
    simpleRequest = require("request");

module.exports = function(agentPool, testcaseRunner, scriptsProvider, batchesProvider) {
    var app = express();

    /*app.mounted(function(otherApp) {
        console.info("[agents] express app was mounted.");
    });*/

    // TODO: Move this to an appropriate location (Node Module?)
    var stringToBoolean = function(string) {
        switch (string.toLowerCase()) {
            case "true":
            case "yes":
            case "1":
                return true;
            case "false":
            case "no":
            case "0":
            case null:
                return false;
            default:
                return Boolean(string);
        }
    };

    /**
     * GETs all the agents connected to this server
     * Optional params:
     * - include_busy=[true,false] Include the busy agents in the response (default: true)
     * - include_not_busy=[true,false] Include the not busy (available) agents in the response (default: true)
     */
    app.get('/', routingConfig.provides('json', '*/*'), function(req, res) {
        //sys.puts(sys.inspect(agents)); // inspect the agents object
        var agentsRes = [];

        var includeBusy = !req.query['include_busy'] ? true : stringToBoolean(req.query['include_busy']);
        var includeNotBusy = !req.query['include_not_busy'] ? true : stringToBoolean(req.query['include_not_busy']);
        var isBusy = (includeBusy && includeNotBusy) ? undefined :
                     (includeBusy && !includeNotBusy) ? true :
                     (!includeBusy && includeNotBusy) ? false : undefined; // setting includeBusy and includeNotBusy to false will render all agents
        res.send(agentPool.getAgents(isBusy));
    });

    app.get("/:id", routingConfig.provides('json', '*/*'), function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);

        if (!agent) {
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        } else {
            res.send(agent.getSummary());
        }
    });

    /**
     * Execute the code POSTed in the request body
     */
    app.post("/:id/execute_serialized_code", routingConfig.provides('application/json'), function(req, res, next) {
        var body = req.body;
        var agent = agentPool.getAgentById(req.params.id);
        var testcaseId;
        var options = {
            "global._requestOrigin": req.headers && req.headers.origin
        };

        if (!agent) {
            console.log("Attempted to run test on device that is not connected: " + req.params.id);
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        }

        if(!body.code || !body.code.length) {
            console.log("Attempted to run empty test on agent " + req.params.id);
            res.statusCode = 404;
            return next(new Error('Attempted to run empty test on agent ' + req.params.id));
        }

        try {
            testcaseId = testcaseRunner.executeTest(body, req.params.id, options, scriptsProvider, null, null);
        } catch(ex) {
            console.log("Exception thrown while attempting to run test: " + ex, ex.stack);
            res.statusCode = 404;
            return next(new Error('Exception thrown while attempting to run test: ' + ex));
        }

        // Indicate that the code has started to execute, but that doesn't mean that the code
        // has completed execution, hence the 201
        res.statusCode = 201;
        res.send({testId: testcaseId});
    });

    /**
     * Execute the code from the script specified
     */
    app.post("/:id/execute_script/:scriptId", routingConfig.provides('json', '*/*'), function(req, res, next) {
        var agentId = req.params.id,
            scriptId = req.params.scriptId,
            agent = agentPool.getAgentById(agentId),
            testcaseId,
            options = {
                "global._requestOrigin": req.headers && req.headers.origin
            };

        if (!agent) {
            console.log("Attempted to run test on device that is not connected: " + agentId);
            res.statusCode = 404;
            return next(new Error('agent with id ' + agentId + ' does not exist'));
        }

        try {
            scriptsProvider.findById(scriptId, function(err, script) {
                if (err) return next(new Error(err));

                if (!script) {
                    res.statusCode = 404;
                    return next({message: "The script " + scriptId + " does not exist."});
                }

                try {
                    testcaseId = testcaseRunner.executeTest(script, req.params.id, options, scriptsProvider, null, null);
                } catch(ex) {
                    console.log("Exception thrown while attempting to run test: " + ex, ex.stack);
                    res.statusCode = 404;
                    return next(new Error('Exception thrown while attempting to run test: ' + ex));
                }

                // Indicate that the code has started to execute, but that doesn't mean that the code
                // has completed execution, hence the 201
                res.statusCode = 201;
                res.send({testId: testcaseId});
            });
        } catch (err) {
            console.error(err);
            return next({message: "Invalid scriptId: " + scriptId});
        }
    });

    /**
     * Executes a batch in the specified agent.
     */
    app.post("/:id/execute_batch/:batchId", routingConfig.provides('json', '*/*'), function(req, res, next) {
        console.log("POST batch with id", req.params.batchId);

        var agentId = req.params.id,
            batchId = req.params.batchId,
            agent = agentPool.getAgentById(agentId),
            options = {
                "global._requestOrigin": req.headers && req.headers.origin
            };
            var testcaseIds = [];

        if (!agent) {
            console.log("Attempted to run test on device that is not connected: " + agentId);
            res.statusCode = 404;
            return next(new Error('agent with id ' + agentId + ' does not exist'));
        }

        try {
            batchesProvider.findById(batchId, function(error, batch) {
                if (error) return next(new Error(error));

                if (!batch.scripts || batch.scripts.length === 0) {
                    res.statusCode = 400;
                    return next({message: "The batch does not contain any scripts."});
                }

                var scriptObjects = [];
                var scriptCheck = new Promise(function(resolve, reject) {
                    batch.scripts.forEach(function(scriptObj, index) {
                        var scriptName = scriptObj.name;

                        scriptsProvider.findByName(scriptName, function(error, scripts) {
                            if (error) {
                                reject();
                                return next(new Error(error));
                            }

                            var script = scripts[0];

                            if (!script || script.name !== scriptName) {
                                res.statusCode = 404;
                                return next({message: "The script " + scriptName + " does not exist."});
                            }

                            script.variables.forEach(function(variable, index) {
                                variable.value = scriptObj.variables[index].value;
                            });

                            scriptObjects.push(script);

                            // If this is the last script, we're done checking
                            if (index === batch.scripts.length - 1) {
                                resolve();
                            }
                        });
                    });
                });

                scriptCheck.then(function() {
                    var result = testcaseRunner.createResult(agentId, "Sample batch", " ");
                    (function queueTest(index) {
                        testcaseRunner.executeTest(scriptObjects[index], {id: agentId}, options, result, function() {
                                if (index === scriptObjects.length - 1) {
                                    testcaseRunner.finalize(agentId, result);

                                    res.statusCode = 201;
                                    res.send(null);
                                }
                                else {
                                    queueTest(index + 1);
                                }
                            });
                    })(0);
                });
            });
        } catch (error) {
            console.error(error);
            return next({message: "Invalid batchId: " + batchId});
        }

    });

    /**
     * Begin recording on the agent
     */
    app.post("/:id/recording", routingConfig.provides('application/json'), function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);
        var body = req.body;
        var options = {
            "global._requestOrigin": req.headers && req.headers.origin
        };

        if (!agent) {
            console.log("Attempted to record on device that is not connected: " + req.params.id);
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        }

        if(!body && !body.url) {
            console.log("No app specified to record on");
            res.statusCode = 400;
            return next(new Error('No app specified to record on'));
        }

        if (agent.type === "webdriver") {
            agent.startRecording(body.url, options);
        } else if (agent.type === "socket") {
            agent.startRecording(options);
        }

        res.statusCode = 201;
        res.send({status: "ok"});
    });

    /**
     * Stop recording on the agent
     */
    app.delete("/:id/recording", function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);
        var test = req.params.test;
        if (!agent) {
            console.log("Attempted to stop recording on device that is not connected: " + req.params.id);
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        }

        var source = agent.stopRecording();
        res.send({source: source});
    });

    /**
     * Pause recording on the agent
     */
    app.put("/:id/recording/pause?", function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);
        var test = req.params.test;
        if (!agent) {
            console.log("Attempted to pause recording on device that is not connected: " + req.params.id);
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        }

        var source = agent.pauseRecording();
        res.statusCode = 202;
        res.send({source: source});
    });

    /**
     * Resume recording on the agent
     */
    app.put("/:id/recording/resume?", function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);
        var test = req.params.test;
        if (!agent) {
            console.log("Attempted to resume recording on device that is not connected: " + req.params.id);
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        }

        agent.resumeRecording();
        res.statusCode = 202;
        res.send({status: "ok"});
    });

    /**
     * Add a remote webdriver to our agentpool
     */
    app.post("/webdriver", function(req, res, next) {
        var body = req.body,
            url = body.url,
            browserName = body.browserName,
            crxFile = body.crxFile,
            crxFileName = body.crxFileName;
        if(!url) {
            console.error("No webdriver URL was passed.");
            res.statusCode = 400;
            return next(new Error('Webdriver base-URL was not passed.'));
        }
        if(!browserName) {
            console.error("No browserName specified.");
            res.statusCode = 400;
            return next(new Error('Webdriver browserName not specified.'));
        }
        // testing the connected agent
        url = url.replace(/\/$/, "");
        simpleRequest(url + "/status", function (error, response, body) {
            if(error || response.statusCode != 200) {
                var errorMsg = "The webdriver instance referenced by " + url + " can't be accessed.";
                console.log(errorMsg);
                res.statusCode = 400;
                return next(new Error(errorMsg));
            }
            else {
                var capabilities = {browserName: browserName};
                if(crxFile) {
                    capabilities["chrome.extensions"] = [crxFile];
                    capabilities["chrome.extensionName"] = crxFileName;
                }
                var agent = agentPool.addAgent(capabilities, {
                    url: url,
                    type: agentPool.agentTypes.WEBDRIVER
                });
                res.statusCode = 201;
                res.send(agent.getSummary());
            }
        });
    });

    app.delete("/:id", routingConfig.provides('json', '*/*'), function(req, res, next) {
        var agent = agentPool.getAgentById(req.params.id);

        if (!agent) {
            res.statusCode = 404;
            return next(new Error('agent with id ' + req.params.id + ' does not exist'));
        } else {
            var summary = agent.getSummary();
            agentPool.removeAgent(req.params.id);
            res.statusCode = 200;
            res.send(summary);
        }
    });

    return app;
};
