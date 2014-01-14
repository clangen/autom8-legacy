/* please publish this some day */
/* npm install ffi ref colors */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
var Colors = require('colors');
var Q = require('q');
require('colors');

var RPC_MODE_SYNC = 1;
var RPC_MODE_ASYNC = 2;

var INIT = "[init]";
var BRIDGE_LOG = "[bridge log]".grey;
var ERROR = "[bridge]".magenta;
var RPC_ENGINE = "[rpc engine]".grey;
var RPC_SEND = "[rpc send]".yellow;
var RPC_RECV = "[rpc recv]".green;
var LOG_LEVELS = { '0': '[nfo]'.grey, '1': '[wrn]'.yellow, '2': '[err]'.red };

var dll = null;
var initialized = false;
var nextId = 0;

var tagColors = { };
var allColors = ['red', 'yellow', 'green', 'blue', 'magenta'];

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
        "autom8_init": ['int', ['int']],
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
                delete handlers[id];
                promise.reject({status: -1, message: "low-level call failed"});
            });
        }
    });
};

var initLogging = function() {
    var log = function(level, tag, message) {

        var color = tagColors[tag];
        if (!color) {
            var random = Math.round(Math.random() * (allColors.length - 1));
            color = tagColors[tag] = allColors[random];
        }

        var colorFn = Colors[color];
        console.log(BRIDGE_LOG, LOG_LEVELS[level], "[" + colorFn.call(this, tag) + "]", message);
    };

    var nativeLogCallback = ffi.Callback('void', ['int', 'string', 'string'], log);

    pinned.logger = { callback: log, functionPointer: nativeLogCallback }; /* don't gc me! */

    dll.autom8_set_logger(nativeLogCallback);
    console.log(BRIDGE_LOG, "initialized");
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
    console.log(RPC_ENGINE, "rpc callback registered");
};

exports.init = function(options) {
    var deferred = Q.defer();

    options = options || { };
    var rpcMode = options.rpcMode || RPC_MODE_SYNC;
    var directory = options.directory;

    if (!dll) {
        directory = directory || path.resolve(__dirname + '/../../../');
        console.log(INIT, "loading libautom8 from", directory);
        dll = loadLibrary(directory);
        console.log(INIT, "loaded libautom8");
    }

    if (!initialized) {
        initLogging();
        initRpcCallback();
        console.log(INIT, "autom8_version:", dll.autom8_version());
        console.log(INIT, "autom8_version:", dll.autom8_init(rpcMode));
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
            console.log(INIT, "autom8_deinit completed");
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
