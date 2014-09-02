var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
var Colors = require('colors');
var Q = require('q');
require('colors');

var shared = "./../../shared/js/backend/";
var log = require(shared + 'Logger.js');
var resource = require(shared + 'Resource.js');

var LIBAUTOM8_DIR = path.resolve(__dirname + '/../../../');

var RPC_MODE_SYNC = 1;
var RPC_MODE_ASYNC = 2;

var NATIVE_LOG = "[libautom8]".grey;
var RPC_SEND = "[rpc send]".yellow;
var RPC_RECV = "[rpc recv]".green;

var DEBUG_RPC = false;

var LOG_LEVELS = {
    '0': log.info,
    '1': log.warn,
    '2': log.error
};

var dll = null;
var initialized = false;
var nextId = 0;

var tagColors = { };
var allColors = ['red', 'yellow', 'green', 'blue', 'magenta'];
var rotateColors = 0;

var handlers = { };

/* hash of things we don't want the GC to collect. these
are mostly callbacks handed to the native portion that
ffi can't predict the lifetime of */
var pinned = { };

process.on('exit', function() {
    pinned;
});

var loadLibrary = function() {
    var dllFilename =
        resource.resolve('lib', 'libautom8.so', [__dirname, LIBAUTOM8_DIR])  ||
        resource.resolve('lib', 'libautom8.dll', [__dirname, LIBAUTOM8_DIR]) ||
        resource.resolve('lib', 'libautom8.dylib', [__dirname + "./../", LIBAUTOM8_DIR]);

    if (dllFilename) {
        var dllDir = path.dirname(dllFilename);
        log.info(NATIVE_LOG, "loading libautom8 from", dllDir);

        return ffi.Library(dllDir + "/libautom8", {
            "autom8_version": ['string', []],
            "autom8_init": ['int', ['int']],
            "autom8_deinit": ['int', []],
            "autom8_set_logger": ['int', ['pointer']],
            "autom8_set_rpc_callback": ['int', ['pointer']],
            "autom8_rpc": ['void', ['string']]
        });
    }
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
        if (DEBUG_RPC) {
            console.log(RPC_RECV, logId, JSON.stringify(result));
        }

        /* IMPORTANT: always resolve during the next tick of the event
        loop to prevent potentially large RPC call stacks */
        setImmediate(function() {
            promise.resolve(result);
        });
    };

    if (DEBUG_RPC) {
        console.log(RPC_SEND, logId, payload);
    }

    /* IMPORTANT: make sure all RPC calls are made as part of their
    own pass through the event loop to avoid making an RPC call in the
    same stack as another one */
    setImmediate(function() {
        dll.autom8_rpc(payload);
    });
};

var initLogging = function() {
    var localLogCallback = function(level, tag, message) {
        var color = tagColors[tag];
        if (!color) {
            color = tagColors[tag] = allColors[++rotateColors % allColors.length];
        }

        tag = "[" + tag + "]";
        var colorFn = Colors[color];
        var args = [NATIVE_LOG, colorFn.call(this, tag), message];

        var logFn = LOG_LEVELS[level] || log.info;
        logFn.apply(this, args);
    };

    var nativeLogCallback = ffi.Callback('void', ['int', 'string', 'string'], localLogCallback);

    pinned.logger = { callback: localLogCallback, functionPointer: nativeLogCallback }; /* don't gc me! */

    dll.autom8_set_logger(nativeLogCallback);
    log.info(NATIVE_LOG, "initialized");
};

var initRpcCallback = function() {
    var rpcCallback = ffi.Callback('void', ['string'], function(response) {
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
    log.info(NATIVE_LOG, "rpc callback registered");
};

var EXPORTS = { };
exports = module.exports = EXPORTS;
EXPORTS.events = Object.create(require('events').EventEmitter.prototype);

EXPORTS.init = function(options) {
    var deferred = Q.defer();

    options = options || { };
    var rpcMode = options.rpcMode || RPC_MODE_SYNC;
    var directory = options.directory;

    if (!dll) {
        dll = loadLibrary();

        if (dll) {
            log.info(NATIVE_LOG, "loaded libautom8");
        }
        else {
            log.error(NATIVE_LOG, "unable to load libautom8".red);
            process.exit(1);
        }
    }

    if (!initialized) {
        initLogging();
        initRpcCallback();
        log.info(NATIVE_LOG, "autom8_version:", dll.autom8_version());
        log.info(NATIVE_LOG, "autom8_init:", dll.autom8_init(rpcMode) === 1 ? "success".green : "failed".red);
        initialized = true;
    }

    setTimeout(function(){
        deferred.resolve();
    });

    return deferred.promise;
};

EXPORTS.deinit = function() {
    var deferred = Q.defer();

    if (initialized) {
        dll.autom8_deinit();
        log.info(NATIVE_LOG, "autom8_deinit completed");
        initialized = false;
    }

    setTimeout(function() {
        deferred.resolve();
    });

    return deferred.promise;
};

EXPORTS.rpc = function(component, command, options) {
    var deferred = Q.defer();
    makeRpcCall(component, command, options, deferred);
    return deferred.promise;
};