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
var LOG_LEVELS = { '0': '[nfo]', '1': '[wrn]', '2': '[err]' };

var dll = null;
var initialized = false;
var nextId = 0;

var handlers = { };

/* hash of things we don't want the GC to collect. these
are mostly callbacks handed to the native portion that
ffi can't predict the lifetime of */
var pinned = { };

process.on('exit', function() {
    pinned;
});

var loadLibrary = function(dllDir) {
    dllDir = dllDir || ".";

    return ffi.Library(dllDir + "/libautom8", {
        "autom8_version": ['string', []],
        "autom8_init": ['int', []],
        "autom8_deinit": ['int', []],
        "autom8_set_logger": ['int', ['pointer']],
        "autom8_set_rpc_callback": ['int', ['pointer']],
        "autom8_rpc": ['void', ['string']],
    });
};

var makeRpcCall = function(component, command, options, promise) {
    var id = "nodeRpcCall-" + nextId++;
    var logId = component + "::" + command;

    var payload = JSON.stringify({
        "id": id,
        "component": component,
        "command": command,
        "options": options || { }
    });

    /* this is the code that gets run when ffi invokes the callback */
    handlers[id] = function(result) {
        console.log(RPC_RECV, logId, JSON.stringify(result));

        setImmediate(function() {
            promise.resolve(result);
        });
    };

    console.log(RPC_SEND, logId, payload);
    dll.autom8_rpc.async(payload, function(err, res) {
        if (err) {
            setImmediate(function() {
                delete pinned['rpc-' + id];
                promise.reject({status: -1, message: "low-level call failed"});
            });
        }
    });
};

var initLogging = function() {
    var log = function(level, tag, message) {
        console.log(INFO, "[" + tag + "] " + LOG_LEVELS[level] + " " + message);
    };

    var nativeLogCallback = ffi.Callback('void', ['int', 'string', 'string'], log);

    pinned.logger = { callback: log, functionPointer: nativeLogCallback }; /* don't gc me! */

    dll.autom8_set_logger(nativeLogCallback);
    console.log(INFO, "logger registered");
};

var initRpcCallback = function() {
    var rpcCallback = ffi.Callback('void', ['string'], function(response) {
        // console.log(JSON.stringify(response));

        response = JSON.parse(response);
        var id = response.id;
        var handler = handlers[id];

        if (handler) {
            handler(response);
            delete handlers[id];
        }
    });

    pinned.rpcCallback = rpcCallback; /* don't gc me! */

    dll.autom8_set_rpc_callback(rpcCallback);
    console.log(INFO, "rpc callback registered");
};

exports.init = function(directory) {
    var deferred = Q.defer();

    if (!dll) {
        directory = directory || path.resolve(__dirname + '/../../../');
        console.log(INFO, "loading libautom8 from", directory);
        dll = loadLibrary(directory);
        console.log(INFO, "loaded libautom8");
    }

    if (!initialized) {
        initLogging();
        initRpcCallback();
        console.log(INFO, "autom8_version:", dll.autom8_version());
        console.log(INFO, "autom8_version:", dll.autom8_init());
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
