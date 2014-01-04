/* please publish this some day */
/* npm install ffi ref colors */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
var Q = require('q');
require('colors');

var INFO = "[bridge]".grey;
var ERROR = "[bridge]".magenta;
var RPC_SEND = "[rpc send]".yellow;
var RPC_RECV = "[rpc recv]".green;

var dll = null;
var initialized = false;

var loadLibrary = function(dllDir) {
    dllDir = dllDir || ".";

    return ffi.Library(dllDir + "/libautom8", {
    "autom8_version": ['string', []],
        "autom8_init": ['int', []],
        "autom8_deinit": ['int', []],
        "autom8_set_logger": ['int', ['pointer']],
        "autom8_rpc": ['void', ['string', 'pointer']],
    });
};

var makeRpcCall = (function() {
    var noOp = function() { };
    var current;
    var queue = [];

    /* this is the callback that gets invoked by libautom8, not to be confused
    with the async() completion callback. here, we store the result, and wait
    for the completion event to fire */
    var callbackHandler = ffi.Callback('void', ['string'], function(result) {
        current.result = JSON.parse((result || "{ }").replace(/(\r\n|\n|\r)/gm,"")); /* no newlines */
    });

    var dequeueAndSend = function() {
        if (queue.length) {
            current = queue.shift();

            console.log(RPC_SEND, current.logId, current.payload);

            dll.autom8_rpc.async(current.payload, callbackHandler, function(err, res) {
                if (err) {
                    current.promise.reject({status: -1, message: "low-level call failed"});
                }
                else {
                    /* this is the completion event. our callback should have already
                    fired, so pull the result out of the struct and notify our callback.
                    if there is more work to do, schedule the next rpc call */
                    console.log(RPC_RECV, current.logId, current.result);

                    current.promise.resolve(current.result);
                    current = null;
                }

                dequeueAndSend();
            });
        }
    };

    return function(component, command, options, promise) {
        queue.push({
            logId: component + "::" + command,

            payload: JSON.stringify({
                "component": component,
                "command": command,
                "options": options || { }
            }),

            promise: promise
        });

        if (!current) {
            dequeueAndSend();
        }
    };
}());

var initLogging = function() {
    var levels = { '0': '[nfo]', '1': '[wrn]', '2': '[err]' };

    var log = function(level, tag, message) {
        console.log(INFO, "[" + tag + "] " + levels[level] + " " + message);
    };

    var nativeLogCallback = ffi.Callback('void', ['int', 'string', 'string'], log);
    dll.autom8_set_logger(nativeLogCallback);

    console.log(INFO, "logger registered");
};

exports.init = function() {
    var deferred = Q.defer();

    if (!dll) {
        var directory = path.resolve(__dirname + '/../');
        dll = loadLibrary(directory);
        console.log(INFO, "loaded libautom8.dll");
    }

    if (!initialized) {
        console.log(INFO, "autom8_version:", dll.autom8_version());
        console.log(INFO, "autom8_version:", dll.autom8_init());
        initLogging();
        initialized = true;
    }

    deferred.resolve();
    return deferred.promise;
};

exports.deinit = function() {
    var deferred = Q.defer();

    if (!initialized) {
        deferred.resolve();
    }
    else {
        dll.autom8_deinit.async(function(err, res) {
            console.log(INFO, "autom8_deinit completed");
            initialized = false;
            deferred.resolve();
        });
    }

    return deferred.promise;
};

exports.version = function() {
    return dll.autom8_version();
};

exports.rpc = function(component, command, options) {
    var deferred = Q.defer();
    makeRpcCall(component, command, options, deferred);
    return deferred.promise;
};