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
 * Starts up the server defined in server.js
 */

var PORT = 8081;

///-------------------------------------------
/// Shell Usage
///-------------------------------------------
var optimist = require('optimist');
var argv = optimist
    .usage('Usage: $0')
    .describe('debug', 'Run server with debug output enabled')
    .describe('production', 'Run server in production mode')
    .describe('port', 'Override listen port')
    .argv;

if(argv.help) {
    optimist.showHelp();
    process.exit();
}

if(argv.production) {
    process.env.NODE_ENV = "production";
} else {
    process.env.NODE_ENV = "development";
}

if(argv.port) {
    PORT = argv.port;
}
///-------------------------------------------

var express = require("express"),
	http = require("http"),
	path = require("path"),
  serveIndex = require("serve-index"),
  serveStatic = require("serve-static");


var app = express();
var server = http.createServer(app);

var screening = require('./server.js');
screening.createServer();
app.use("/screening", screening.app);

if (process.env.NODE_ENV = "development") {
	var MONTAGE_PATH = path.join(__dirname, "../../node_modules/montage");

	app.use("/node_modules/montage", serveStatic(MONTAGE_PATH));
	app.use("/node_modules/montage", serveIndex(MONTAGE_PATH));
}

var socketApi = require("./lib/sockets.js");
socketApi.setupSocketIO(server, screening.agentPool, screening.SCREENING_VERSION);

screening.testcaseRunner.socketApi = socketApi;

server.listen(PORT);
console.log("Environment: Node.js -", process.version, "Platform -", process.platform);
console.log("Screening Server running on port " + PORT + " [" + process.env.NODE_ENV + "]");
console.log("Screening Control Room: http://localhost:" + PORT + "/screening/control-room/index.html");
