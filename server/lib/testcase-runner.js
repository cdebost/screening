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

var fs = require("fs"),
    path = require("path"),
    vm = require("vm"),
    agentTypes = require('./agent-pool.js').agentTypes,

    Sync = require('./sync.js').Sync,
    ScriptClass = require('./testcase/script.js').Script,
    Result = require('./testcase/result.js').Result,

    // Promises
    Q = require("q"),
    when = Q.when,

    mouseEnum = require('./agents/util.js').Mouse,
    keyEnum = require('./agents/util.js').Key,

    // Webdriver Agent
    WebDriverAgent = require('./agents-webdriver/agent.js').WebDriverAgent,
    createWebdriverSession = require('./agents-webdriver/util.js').createWebdriverSession,

    // Socket Agent
    SocketAgent = require('./agents-socket/agent.js').SocketAgent,

    // Actually we just import the assert.js, to generate the mapping code further down, that we inject in the test script,
    // no idea how to otherwise map methods to the inside-function scope, so we generate them.
    assertDecorator = require('../lib/testcase/assert-decorator.js'),
    asserts = require('./testcase/assert.js'),
    getStackTraceByErrorStack = require("./util.js").getStackTraceByErrorStack,
    TMP_TEST_FILE_NAME = require("../consts.js").TMP_TEST_FILE_NAME;

/**
 * Test TestcaseRunner is able to execute tests. With it we can trigger
 * which tests should be executed where.
 *
 * @constructor
 * @param {Object} agentPool a management pool of agents where we can select from
 * @param {Boolean} isDebugMode defines if we run in debug-mode
 */
var TestcaseRunner = exports.TestcaseRunner = function(agentPool, isDebugMode, testcaseResultsProvider) {
    this.browsers = [];
    this.agentPool = agentPool;
    this.isDebugMode = !!isDebugMode;
    this.resultsProv = testcaseResultsProvider;
};

/**
 * Executes a test file that is accessible by this node instance.
 *
 * @param {String} testFile full path to a file on disk
 * @param {Object} desiredCaps which capabilities should the agent support
 * @return void
 */
TestcaseRunner.prototype.executeTestFile = function(testFile, desiredCaps) {
    var self = this;

    fs.readFile(testFile, "utf8", function(err, data) {
        self.executeTest(data, desiredCaps);
    });
};

/**
 * Writes results to the database and notifies the control-room
 */
TestcaseRunner.prototype.finalize = function(agentId, result) {
    // Write the results to the DB
    result.finalize();

    this.resultsProv.upsert(result.get(), function(err) {
        if (err) throw err;
    });

    // Show the notification to the control room
    var agent = this.agentPool.getAgentById(agentId);
    agent.endTest(result.get());
};

TestcaseRunner.prototype.createResult = function(agentId, name, code) {
    var agent = this.agentPool.getAgentById(agentId);
    return new Result(agent, {
        id: this.resultsProv.generateId(),
        name: name,
        code: code
    });
};

/**
 * Executes a script string.
 *
 * @param {String} testScript a complete test script object, contains the code and name
 * @param {String} agentId
 * @param {Object} options will describe preferences during this run of the code (they do not persist)
 * @param {Object} scriptsProvider object to retrieve scripts by the server. Used to link scripts together
 * @param {Object=} result the result object to use with the test. Will be created if null or undefined is passed in
 * @param {Function=} completeCb the callback to call once the test has finished executing. If undefined or null,
 * will simply finalize the results.
 * @return {Number} test case id
 */
TestcaseRunner.prototype.executeTest = function(testScript, agentId, options, scriptsProvider, result, completeCb) {
    // TODO: extract the agents from the testscript
    var agent = this.agentPool.getAgentById(agentId);
    agent.startTest();

    // Create the result object if it doesn't exist
    result = result || this.createResult(agent.id, testScript.name, testScript.code);

    // If the callback parameter is not specified, finalize the result by default.
    var self = this;
    completeCb = completeCb || function(result) {
            self.finalize(agent.id, result);
        };

    var sync = Object.create(Sync).init();

    // Validate that the passed testScript object contains code and name
    if(!testScript.code || !testScript.name) throw new Error("testScript must be an object with code and name properties.");

    // the options object can be manipulated in the test script
    var scriptObject = new ScriptClass();
    scriptObject.sync = sync;
    for(var i in testScript.preferences) {
        var pref = testScript.preferences[i];
        scriptObject.setOption(pref.shortName, pref.value);
    }
    for(var i in options){
        scriptObject.setOption(i, options[i]);
    }

    this._linkScripts(testScript, scriptsProvider).then(function() {
        switch (agent.type) {
            case agentTypes.WEBDRIVER:
                self._executeWebdriverTest(testScript, agent, scriptObject, options, sync, result, completeCb);
                break;
            case agentTypes.SOCKET:
                self._executeSocketTest(testScript, agent, scriptObject, options, sync, result, completeCb);
                break;
            default:
                throw new Error("Unrecognized agent type", agent.type);
        }
    }, function(err) {
        throw err;
    });

    // add the result to our central repository
    this.resultsProv.upsert(result.get(), function(err) {
        if (err) throw err;
    });
    return result.testcase.id;
};

TestcaseRunner.prototype._linkScripts = function(testScript, scriptsProvider) {
    var defer = Q.defer();

    // Scan the script for require statements and get the script names
    var searchResult,
        scriptNames = [],
        re = /(?:^|\W)require\((.*?)\)/g;
    while (searchResult = re.exec(testScript.code)) {
        var name = searchResult[1] || searchResult[2];

        if (name.length > 2 && name[0] === '"' && name[name.length-1] === '"') {
            name = name.substring(1, name.length-1);
            scriptNames.push(name);
        }
    }

    // Get the actual script objects from the script names
    if (scriptNames.length === 0) {
        defer.resolve();
    } else {
        var scripts = {};
        scriptNames.forEach(function(name, index) {
            scriptsProvider.findByName(name, function(err, results) {
                if (err || results.length < 1) {
                    defer.reject(new Error("Unable to find script " + name));
                } else {
                    scripts[name] = results[0];

                    if (index === scriptNames.length-1) {
                        testScript.linkedScripts = scripts;
                        defer.resolve();
                    }
                }
            });
        });
    }

    return defer.promise;
};

TestcaseRunner.prototype._executeWebdriverTest = function(testScript, agent, scriptObject, options, sync, result, completeCb) {
    var self = this;
    var session = createWebdriverSession(agent.url);

    // Start the webdriver session
    session.init(agent.capabilities, function(err) {
        if(!err.sessionId) {
            // Wrap error message inside Error object if required
            if (!(err instanceof Error)) {
                if (err.value && err.value.message) {
                    err = new Error(err.value.message);
                } else {
                    err = new Error(err);
                }
            }

            // If we have a valid session quit, if not simply display the results
            if (session.sessionUrl) {
                session.quit().then(function successCb() {
                    result.reportException(err);
                    if (completeCb) {
                        completeCb(result);
                    }
                });
            } else {
                result.reportException(err);
                if (completeCb) {
                    completeCb(result);
                }
            }
        } else {
            // The session succeeded. Execute the test, using our code synchronization system
            when(self._executeTestInVm(testScript.code, testScript.variables, result, new WebDriverAgent(session, sync, scriptObject, result),
                scriptObject, sync), function() {
                // kill the webdriver session
                session.quit().then(function() {
                    if (completeCb) {
                        completeCb(result);
                    }
                });
            });
        }
    });

    return result;
};

TestcaseRunner.prototype._executeSocketTest = function (testScript, agent, scriptObject, options, sync, result, completeCb) {
    var self = this;

    scriptObject.globalObjects = {
        require: function(scriptName) {
            var script = testScript.linkedScripts[scriptName];
            if (!script) {
                throw new Error("Could not require script with name " + scriptName + ". Script not found");
            }
            return function(scriptVariables) {
                //!!! Not working due to nested synchronous promises
                return;

                scriptVariables = scriptVariables || {};
                return sync.promise(function() {
                    var defer = Q.defer();

                    // Socket.io hack -- for some reason the openNewWindow message does not pass unless we first emit another message
                    agent.socket.emit("");
                    agent.socket.emit("openNewWindow");

                    var address = agent.address;
                    if(address.match(/^http:/) || address.match(/^::ffff:/)) {
                        address = address.substring(7); // Cut out address prefixes
                    }

                    self.socketApi.onNewAgent(address.split(':')[0], agent.capabilities, function(newAgent) {
                        when(self._executeTestInVm(script.code, scriptVariables, result,
                            new SocketAgent(newAgent, sync, scriptObject, result), scriptObject, sync), function() {
                                defer.resolve();
                            }
                        );
                    });

                    return defer.promise;
                });
            };
        }
    };

    when(self._executeTestInVm(testScript.code, testScript.variables, result, new SocketAgent(agent, sync, scriptObject, result),
        scriptObject, sync), function() {
            // Socket.io hack -- for some reason the endTest message does not pass unless we first emit another message
            agent.socket.emit("");
            agent.socket.emit("endTest");
            if (completeCb) {
                completeCb(result);
            }
        }
    );

    return result;
};

/**
 * Execute the given testcase source code on a given agent.
 */
TestcaseRunner.prototype._executeTestInVm = function(source, variables, result, agent, scriptObject, sync){
    // We have to execute test-scripts from the filesystem to get line-numbers.
    var decoratedAsserts = assertDecorator.initSync(result, scriptObject, sync);

    var defer = Q.defer();

    try {
        var script = vm.createScript(source, TMP_TEST_FILE_NAME);
        var scriptContext = {
            __result: result,
            script: scriptObject,
            agent: agent,
            Mouse: mouseEnum,
            Key: keyEnum,
            console: console,
            variables: {},
            require: scriptObject.globalObjects.require
        };

        //Add variables to the script context
        if (variables.constructor === Array) {
            variables.forEach(function(variable) {
                scriptContext.variables[variable.name] = variable.value;
            });
        } else {
            scriptContext.variables = variables;
        }

        scriptObject.globalObjects = scriptObject.globalObjects || {};
        scriptObject.globalObjects["agent"] = agent;
        scriptObject.globalObjects["script"] = scriptObject;
        scriptObject.globalObjects["variables"] = scriptContext.variables;
        // Add all asserts to the script context that we are passing into the test scripts env.
        for (var f in decoratedAsserts) {
            if (f.substr(0, 6)=="assert") { // We ONLY want the assert functions.
                scriptObject.globalObjects[f] = scriptContext[f] = decoratedAsserts[f];
            }
        }
    } catch(ex) {
        ex.message = "Error parsing script: " + ex.message;
        ex.lineNumber = "Unknown";
        ex.columnNumber = "Unknown";
        result.reportException(ex);
        defer.resolve();
        return defer.promise;
    }

    sync.runSync(function() {
        script.runInNewContext(scriptContext);
    }).then(function() {
        defer.resolve();
    }, function(ex) {
        var lineCol = getStackTraceByErrorStack(ex.stack, TMP_TEST_FILE_NAME);
        ex.lineNumber = lineCol[0]-1;
        ex.columnNumber = lineCol[1];
        result.reportException(ex);
        defer.resolve();
    });

    return defer.promise;
};
