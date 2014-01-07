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
        "autom8_rpc": ['void', ['string', 'pointer']],
    });
};

var makeRpcCall = function(component, command, options, promise) {
    var id = nextId++;
    var logId = component + "::" + command;
    var completed = false;

    var payload = JSON.stringify({
        "component": component,
        "command": command,
        "options": options || { }
    });

    /* this is the code that gets run when ffi invokes the callback */
    var completionHandler = function(response) {
        /* FIXME: weird win32 bug -- sometimes callbacks are called multiple times,
        sometimes after things have been GC'd, which leads to all sorts of strange
        bugs. in this case, just return. this appears to be a bug in FFI -- i can't
        reproduce it on other platforms */
        if (completed) {
            console.log("***** CALLBACK CALLED MULTIPLE TIMES *****".red, current.logId, current.id);
            return;
        }

        completed = true;
        var result = JSON.parse((response || "{ }").replace(/(\r\n|\n|\r)/gm,"")); /* no newlines */
        console.log(RPC_RECV, logId, result);

        setImmediate(function() {
            promise.resolve(result);
            delete pinned['rpc-' + id];
        });
    };

    /* this thing wraps a javascript function, and provides a C-like function
    pointer. to us, it's a thing that proxies functions between native and js */
    var functionPointer = ffi.Callback('void', ['string'], completionHandler);

    /* retain a reference to the function, and the function pointer, so it
    doesn't get garbage collected. the interop layer has no way of knowing
    when C has finished processing the event */
    pinned['rpc-' + id] = {callback: completionHandler, fp: functionPointer, id: id};

    console.log(RPC_SEND, logId, payload);
    dll.autom8_rpc.async(payload, functionPointer, function(err, res) {
        /* invoke the callback in the next pass through the event loop. we do this
        because if we throw an error in the completion callback, it sometimes
        bubbles up and causes the native runtime to die */
        if (err) {
            setImmediate(function() {
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

    /* make sure neither of these methods get garbage collected,
    they need to exist for the duration of the app run */
    pinned.logger = {callback: log, functionPointer: nativeLogCallback }

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
        initLogging();
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