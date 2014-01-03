/* please publish this some day */
/* npm install ffi ref colors */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
require('colors');

var LOCAL_LOG = "[local]".grey;
var ERROR_LOG = "[local-error]".red;
var SERVER_LOG = "[server]".magenta;
var RPC_SEND = "[rpc-send]".yellow;
var RPC_RECV = "[rpc-recv]".green;
var DEINIT_TIMEOUT_MILLIS = 10000;
var POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME = 2500;

var noOp = function() { };

var dllDir = path.resolve(__dirname + '/../Debug');
process.chdir(dllDir);

var dll = ffi.Library(dllDir + "/libautom8", {
"autom8_version": ['string', []],
    "autom8_init": ['int', []],
    "autom8_deinit": ['int', []],
    "autom8_set_logger": ['int', ['pointer']],
    "autom8_rpc": ['void', ['string', 'pointer']],
});

console.log("\n------------------------------------------------------------\n".green);
console.log(LOCAL_LOG, "loaded libautom8.dll");
console.log(LOCAL_LOG, "autom8_version:", dll.autom8_version());
console.log(LOCAL_LOG, "autom8_init:", dll.autom8_init());

function die(code) {
    console.log('\ngoodbye...\n');
    process.exit(parseInt(code, 10) || -1);
}

var util = {
    initLogging: function() {
        var levels = { '0': '[i]', '1': '[w]', '2': '[e]' };

        var log = function(level, tag, message) {
            console.log(SERVER_LOG, "[" + tag + "]" + levels[level] + " " + message);
        };

        var nativeLogCallback = ffi.Callback('void', ['int', 'string', 'string'], log);
        dll.autom8_set_logger(nativeLogCallback);

        console.log(LOCAL_LOG, "registered logger");
    },

    makeRpcCall: (function() {
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
                    /* this is the completion event. our callback should have already
                    fired, so pull the result out of the struct and notify our callback.
                    if there is more work to do, schedule the next rpc call */
                    console.log(RPC_RECV, current.logId, current.result);

                    current.callback(current.result);
                    current = null;

                    dequeueAndSend();
                });
            }
        };

        return function(component, command, options, callback) {
            if (typeof options === "function") {
                callback = options;
                options = { };
            }

            queue.push({
                logId: component + "::" + command,

                payload: JSON.stringify({
                    "component": component,
                    "command": command,
                    "options": options || { }
                }),

                callback: callback || noOp
            });

            if (!current) {
                dequeueAndSend();
            }
        };
    }())
};

util.initLogging();
var exit = false;

util.makeRpcCall("system", "list", function(result) {
    console.log(LOCAL_LOG, "system::list");

    var systems = result.message.systems || [];
    for (var i = 0; i < systems.length; i++) {
        console.log(LOCAL_LOG, "  " + i + ": " + systems[i]);
    }
});

util.makeRpcCall("system", "current", function(result) {
    console.log(LOCAL_LOG, "system::current");
    console.log(LOCAL_LOG, '  system_id:', result.message.system_id);
});

var device = {
    label: "office",
    address: "a1",
    type: 0 /* lamp */
};

util.makeRpcCall("system", "add_device", device, function(result) {
    console.log(LOCAL_LOG, "system::add_device");
    console.log(LOCAL_LOG, '  device:', result.message.device || result.message.error);
});

util.makeRpcCall("system", "list_devices", function(result) {
    console.log(LOCAL_LOG, "system::list_devices");
    console.log(LOCAL_LOG, '  devices:', result.message.devices || result.message.error);
});

util.makeRpcCall("server", "get_preference", {key: "fingerprint" }, function(result) {
    console.log(LOCAL_LOG, "system::get_preference(fingerprint)");
    console.log(LOCAL_LOG, '  result:', result);
});

util.makeRpcCall("server", "set_preference", {key: "foo1", value: "bar1" }, function(result) {
    console.log(LOCAL_LOG, "system::set_preference(foo1)");
    console.log(LOCAL_LOG, '  result:', result);
});

util.makeRpcCall("server", "get_preference", {key: "foo1" }, function(result) {
    console.log(LOCAL_LOG, "system::get_preference(foo1)");
    console.log(LOCAL_LOG, '  result:', result);
});

util.makeRpcCall("server", "start", function() {
    var checkExit = function() {
        if (exit) {
            console.log(ERROR_LOG, "detected exit flag, attempting shut down...");
            util.makeRpcCall("server", "stop", function() {
                console.log(LOCAL_LOG, "autom8_deinit");

                dll.autom8_deinit.async(function(err, res) {
                    die(0);
                });
            });
        }
    };

    /* poll sigint/ctrl+c exit flag... */
    setInterval(checkExit, POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME); /* can we do this without polling, please? */
});

process.on('SIGINT', function() {
    console.log(LOCAL_LOG, "caught ctrl+c, setting exit flag (please wait a few seconds)...");
    exit = true;

    setTimeout(function() {
        console.log(ERROR_LOG, "timed out waiting for autom8 to de-initialize. force-killing...");
        die(-1);
    }, DEINIT_TIMEOUT_MILLIS);
});
