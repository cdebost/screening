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

var parseUrl = require("url").parse;
var Q = require("q");
var xhr = require("request");

var By = exports.By = {
    className : function(param){
        return {using: "class name", "value": param}
    },
    cssSelector: function(param){
        return {using: "css selector", "value": param}
    },
    query: function(param){
        return {using: "css selector", "value": param}
    },
    id: function(param){
        return {using: "id", "value": param}
    },
    linkText: function(param){
        return {using: "link text", "value": param}
    },
    name: function(param){
        return {using: "name", "value": param}
    },
    partialLinkText: function(param){
        return {using: "partial link text", "value": param}
    },
    tagName: function(param){
        return {using: "tag name", "value": param}
    },
    xpath: function(param){
        return {using: "xpath", "value": param}
    }
};

exports.MOUSEBUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

var pshallow = exports.pshallow=function(obj){
    for (var i in obj){
        try {
        if (typeof obj[i]=="object" ||typeof obj[i]=="function"){
            console.log("obj[" + i + "]" + typeof obj[i]);
        }else{
            if ((typeof obj[i]=='string')||(obj[i] && obj[i].toString)) {
                console.log("obj[" + typeof obj[i] + "[" + i + "]" + obj[i]);
            }else if (typeof obj[i]=="boolean") {
                console.log("obj[" + i + "]" + obj[i]);

            }else{
                    console.log("*obj[" + i + "]" + typeof obj[i]);
            }
        }
        }catch(e){
            console.log("Error on: " + i);
        }
    }
};

//shallow mixin
var mix = exports.mix = function(){
    var base = arguments[0];
    for (var i=0; i<arguments.length; i++){
        for (var prop in arguments[i]){
            base[prop]=arguments[i][prop];
        }
    }
    return base;
};

//wonder if i should be doing this on my own?
var strip = function strip(str){
    var x=[];
    for(var i in str){
        if (str.charCodeAt(i)){
            x.push(str.charAt(i));
        }
    }
    return x.join('');
};

var responseHandler = function (error, response, body) {
    const HTTP_204_NO_CONTENT = 204; // The server successfully processed the request, but is not returning any content.

    if (response.statusCode >= 300 ||
        response.statusCode === HTTP_204_NO_CONTENT // For Selenium Server DELETE
        ) {
        return response;
    }

    if (response && typeof(body) === "object") {
        // Apparently with newer node versions we may get back the parsed JSON object here instead of a string
        // If so, just return that.
        return body;
    }

    if (response && typeof(body) !== "undefined") {
        var ret = "";
        // selenium-server sometimes return an empty body
        try {
            ret = JSON.parse(strip(body));
        } catch (ex) {
        }
        return ret;
    }
};

var GETHeaders={
    accept: "application/json;charset=utf-8",
    "content-type": "application/json;charset=utf-8"
};

var POSTHeaders={
    "accept": "application/json;charset=utf8",
    "content-type": "application/json;charset=utf8"
};
var GET=exports.GET=function(request){
    var req= {
        url: request.url,
        method: "GET",
        headers: mix({},GETHeaders,{host: parseUrl(request.url).host}, request.headers)
    };

    //print("GET " + req.url);
    var defer = Q.defer();
    xhr(req, function(error, response, body){
        if(error){
            defer.reject(error);
        }
        else {
            ret = responseHandler(error, response, body);
            if(ret.statusCode && ret.statusCode >= 400){
                defer.reject("error");
            }
            else {
                defer.resolve(ret);
            }
        }
    });
    return defer.promise;
};

var DELETE=exports.DELETE=function(request){
    var req= {
        url: request.url,
        method: "DELETE",
        headers: mix({},GETHeaders,{host: parseUrl(request.url).host}, request.headers)
    };

    var defer = Q.defer();
    xhr(req, function(error, response, body){
        if(error){
            defer.reject(error);
        }
        else {
            ret = responseHandler(error, response, body);
            if(ret.statusCode && ret.statusCode >= 400){
                defer.reject("error");
            }
            else {
                defer.resolve(ret);
            }
        }
    });
    return defer.promise;
};

/*
This entire method is re-implemented using only node's http client library, there's a problem
with the request library and chromedriver 17+.
Please do not remove. I'll keep this here and keep testing with updated versions of request.
 */
//var POST=exports.POST=function(request){
//    var req= {
//        url: request.url,
//        method: "POST",
//        headers: mix({},POSTHeaders,{host: parseUrl(request.url).host}, request.headers)
//    }
//    //print("POST: " + request.body);
//    //print("type: " + typeof request.body);
//
//    //print("POST " + req.url);
//    if (request.body) {
//        req.body = request.body;
//    }
//    req.headers['Content-Length']=(request.body && request.body.length) ? request.body.length : "0";
//
//    var defer = Q.defer();
//    xhr(req, function(error, response, body){
//        if(error){
//            defer.reject(error);
//        }
//        else {
//            ret = responseHandler(error, response, body);
//            if(ret.statusCode && ret.statusCode >= 400){
//                var retBody = JSON.parse(body);
//                defer.reject(retBody);
//            }
//            else {
//                defer.resolve(ret);
//            }
//        }
//    });
//    return defer.promise;
//}

var POST = exports.POST = function(request) {
    var http = require("http");

    var parsedUrl = parseUrl(request.url);
    var options = {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + (parsedUrl.search || "") + (parsedUrl.hash || ""),
        method: "POST",
        headers: mix({}, POSTHeaders, {host: parsedUrl.host}, request.headers)
    };

    // Fix the body
    if(typeof(request.body) === "object") {
        request.body = JSON.stringify(request.body);
    }
    if (request.body) {
        request.body = new Buffer(request.body);
    }

    options.headers['Content-Length'] = (request.body && request.body.length) ? request.body.length : "0";

    var defer = Q.defer();

    var httpReq = http.request(options, function(res) {
        var fullBody = "";
        res.on('data', function(chunk) {
            fullBody += chunk;
        });
        res.on('end', function() {
            var ret = responseHandler(null, res, fullBody);

            if (ret.statusCode && ret.statusCode >= 400) {
                var retBody;
                try {
                    var escapedBody = fullBody.replace(/\u0000/g, ""); // Selenium Server fix
                    retBody = JSON.parse(escapedBody);
                } catch(ex) {
                    retBody = {value: {message: "The response contained malformed JSON. Raw output: " + fullBody}};
                }
                defer.reject(retBody);
            }
            else {
                defer.resolve(ret);
            }
        });
    });
    httpReq.on("error", function(e) {
        defer.reject(e);
    });

    if (request.body) {
        httpReq.write(request.body);
    }

    httpReq.end();

    return defer.promise;
};
