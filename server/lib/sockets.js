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
var fs = require('fs');

var SOCKETAGENT_TIMEOUT = 10000;

exports.setupSocketIO = function(httpServer, agentPool, screeningVersion) {
	var io = require('socket.io').listen(httpServer);
	//var io = sio(httpServer);

	/*(function() {
        io.set("heartbeat timeout", 5);
        io.set("heartbeat interval", 7);
    })();*/

    // TODO: this function should be removed in favor of using the rest-api
    function listAvailableTests() {
        return fs.readdirSync(__dirname + "/../sample_tests/");
    }

	io.sockets.on("connection", function(socket) {
        // Control room
		socket.on("initDriver", function(callback) {
            console.log("Client Connected");

			/*if(socket.manager.rooms["/drivers"] == null ||
                socket.manager.rooms["/drivers"].indexOf(socket.id) == -1) {
                socket.join("drivers");
            }*/
            socket.join("drivers");


			socket.on("disconnect", function() {
				console.log("Client disconnected");
			});
			callback(screeningVersion, agentPool.getAgents()/*, listAvailableTests()*/);
		});

		socket.on("initRecorder", function(id) {
            var agent = agentPool.getAgentById(id);
            agent.recorderReady(socket);
        });

        socket.on("initSocketAgent", function(userAgent, callback) {
            var userInfo = parseUserAgent(userAgent);
            var agentCapabilities = {
                browserName: userInfo.browser.name,
                browserVersion: userInfo.browser.version,
                osName: userInfo.os.name,
                osVersion: userInfo.os.version
            };

            // If there is already an agent with the same user agent and address,
            // we should just substitute the new socket for the agent's old socket
            // instead of creating a new agent
            var agent = agentPool.getAgentByCaps(agentCapabilities);

            if (agent && agent.reconnecting) {
                agent.socket = socket;
                agent.reconnecting = false;
                agent.emit("newSocket", socket);
            } else {
                console.log("Received a websocket connection from a socket agent");

                agent = agentPool.addAgent(agentCapabilities, {
                    type: agentPool.agentTypes.SOCKET,
                    socket: socket,
                    url: socket.request.connection.remoteAddress + ":" + socket.request.connection.remotePort
                });
            }

            socket.once("disconnect", function() {
                function removeAgent() {
                    console.log("Socket agent", agent.id, "is no longer available. Removing.");
                    agent.emit("socketDied");
                    agentPool.removeAgent(agent.id);
                }

                if (!agent.reconnecting) {
                    removeAgent();
                } else {
                    setTimeout(function() {
                        if (agent.reconnecting) {
                            removeAgent();
                        }
                    }, SOCKETAGENT_TIMEOUT);
                }
            });

            callback(agent.id);
        });
	});

	// attaching our socket.io port here for control-room communication
	agentPool.io = io;
};

function parseUserAgent(userAgent) {
    return {
        os: parseOS(userAgent),
        browser: parseBrowser(userAgent)
    };
}

function parseOS(userAgent) {
    var name, version;

    if (userAgent.indexOf("iPad") !== -1) {
        name = "iPad";
        if (version = /iPad; CPU OS ([^;) ]+)/.exec(userAgent)) {
            version = version[1].replace(/_/g, ".");
        }
    } else if (userAgent.indexOf("iPhone") !== -1) {
        name = "iPhone";
        if (version = /iPhone; CPU OS ([^;) ]+)/.exec(userAgent)) {
            version = version[1].replace(/_/g, ".");
        }
    } else if (userAgent.indexOf("Macintosh") !== -1) {
        name = "Mac OSX";
        if (version = /Macintosh; Intel Mac OS X ([^;)]+)/.exec(userAgent)) {
            version = version[1].replace(/_/g, ".");
        }
    } else if (userAgent.indexOf("Windows NT") !== -1) {
        name = "Windows";

        var ntVer = /Windows NT ([^)]+);/.exec(userAgent)[1];
        var ntVerMappings = {
            "6.0": "Vista",
            "6.1": "7",
            "6.2": "8",
            "6.3": "8.1",
            "10.0": "10"
        };

        version = ntVerMappings[ntVer];
    } else if (userAgent.indexOf("Android") !== -1) {
        name = "Android";
        if (version = /Linux; Android ([^;)]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else {
        name = "Unknown OS";
        version = "";
    }
    // TODO: iPod support, Linux support?

    return {
        name:  name,
        version: version || "(Version Unknown)"
    };
}

function parseBrowser(userAgent) {
    var name, version;

    if (userAgent.indexOf("OPR") !== -1) {
        name = "Opera";
        if (version = /OPR\/([^ ]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else if (userAgent.indexOf("Firefox") !== -1) {
        name = "Firefox";
        if (version = /Firefox\/([^ ]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else if (userAgent.indexOf("Chrome") !== -1) {
        name = "Chrome";
        if (version = /Chrome\/([^ ]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else if (userAgent.indexOf("Safari") !== -1) {
        name = "Safari";
        if (version = /Version\/([^ ]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else if (userAgent.indexOf("Trident") !== -1) {
        name = "Internet Explorer";
        if (version = /rv:([^ )]+)/.exec(userAgent)) {
            version = version[1];
        }
    } else {
        name = "Unknown Browser";
    }

    return {
        name: name,
        version: version || "(Version Unknown)"
    };
}
