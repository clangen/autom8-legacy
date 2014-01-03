/* please publish this some day */
/* npm install ffi ref q */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
require('colors');

var LOCAL_LOG = "[local log]".grey;
var SERVER_LOG = "[server log]".magenta;
var RPC_SEND = "[rpc send]".yellow;
var RPC_RECV = "[rpc recv]".green;
var ERROR_LOG = "[error]".red;
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
    console.log('\n\ngoodbye...\n');
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

    makeRpcCall: function(component, command, options, callback) {
        var rpcResult = null;

        var rpcCallback = ffi.Callback('void', ['string'], function(result) {
            rpcResult = result;
            console.log(RPC_RECV, rpcResult);
        });

        var payload = JSON.stringify({
            "component": component,
            "command": command,
            "options": options || { }
        });

        console.log(RPC_SEND, payload);
        dll.autom8_rpc.async(payload, rpcCallback, function(err, res) {
            (callback || noOp)(rpcResult);
        });
    }
};

util.initLogging();
var exit = false;

util.makeRpcCall("server", "start", { }, function() {
    var checkExit = function() {
        if (exit) {
            console.log(ERROR_LOG, "detected exit flag, attempting shut down...");
            util.makeRpcCall("server", "stop", { }, function() {
                console.log(LOCAL_LOG, "autom8_deinit:", dll.autom8_deinit());
                die(0);
            });

            setTimeout(function() {
                console.log(ERROR_LOG, "timed out waiting for autom8 to de-initialize. force-killing...");
                die(-1);
            }, DEINIT_TIMEOUT_MILLIS);
        }
    };

    /* poll sigint/ctrl+c exit flag... */
    setInterval(checkExit, POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME); /* can we do this without polling, please? */
});

process.on('SIGINT', function() {
    console.log(LOCAL_LOG, "caught ctrl+c, setting exit flag (please wait a few seconds)...");
    exit = true;
});
