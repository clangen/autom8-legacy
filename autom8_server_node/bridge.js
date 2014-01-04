/* please publish this some day */
/* npm install ffi ref colors */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
var Q = require('q');
require('colors');

var INFO = "[local]".grey;
var ERROR = "[local-error]".red;
var DEINIT_TIMEOUT_MILLIS = 10000;
var POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME = 2500;

console.log("\n------------------------------------------------------------\n".green);

function die(code) {
    console.log('\ngoodbye...\n');
    process.exit(parseInt(code, 10) || -1);
}

var exit = false;

function testSystem() {
    return Q.all([
        nativeBridge.rpc("system", "list").then(function(result) {
            console.log(INFO, "system::list");

            var systems = result.message.systems || [];
            for (var i = 0; i < systems.length; i++) {
                console.log(INFO, "  " + i + ": " + systems[i]);
            }
        }),

        nativeBridge.rpc("system", "current").then(function(result) {
            console.log(INFO, "system::current");
            console.log(INFO, '  system_id:', result.message.system_id);
        })
    ]);
}

function testPreferences() {
    return Q.all([
        nativeBridge.rpc("server", "get_preference", {key: "fingerprint" }).then(function(result) {
            console.log(INFO, "system::get_preference(fingerprint)");
            console.log(INFO, '  result:', result);
        }),

        nativeBridge.rpc("server", "set_preference", {key: "foo1", value: "bar2" }).then(function(result) {
            console.log(INFO, "system::set_preference(foo1)");
            console.log(INFO, '  result:', result);
        }),

        nativeBridge.rpc("server", "get_preference", {key: "foo1" }).then(function(result) {
            console.log(INFO, "system::get_preference(foo1)");
            console.log(INFO, '  result:', result);
        })
    ]);
}

function testDevices() {
    var device = {
        label: "office",
        address: "a1",
        type: 0 /* lamp */
    };

    return Q.all([
        nativeBridge.rpc("system", "add_device", device).then(function(result) {
            console.log(INFO, "system::add_device");
            console.log(INFO, '  device:', result.message.device || result.message.error);
        }),

        nativeBridge.rpc("system", "list_devices").then(function(result) {
            console.log(INFO, "system::list_devices");
            console.log(INFO, '  devices:', result.message.devices || result.message.error);
        })
    ]);
}

function startServer() {
    return nativeBridge.rpc("server", "start").then(function() {
        var checkExit = function() {
            if (exit) {
                console.log(ERROR, "detected exit flag, attempting shut down...");

                nativeBridge.rpc("server", "stop").then(function() {
                    nativeBridge.deinit().then(function() {
                        die(0);
                    });
                });
            }
        };

        /* poll sigint/ctrl+c exit flag... */
        setInterval(checkExit, POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME); /* can we do this without polling, please? */
    });
}

var nativeBridge = require("./NativeBridge.js");

nativeBridge.init()
    .then(testSystem)
    .then(testPreferences)
    .then(testDevices)
    .then(startServer);

process.on('SIGINT', function() {
    console.log(INFO, "caught ctrl+c, setting exit flag (please wait a few seconds)...");
    exit = true;

    setTimeout(function() {
        console.log(ERROR, "timed out waiting for autom8 to de-initialize. force-killing...");
        die(-1);
    }, DEINIT_TIMEOUT_MILLIS);
});
