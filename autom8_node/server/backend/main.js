/* please publish this some day */
/* npm install ffi ref colors q */
var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
var Q = require('q');
var libautom8 = require("./NativeBridge.js");
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

function testSystem() {
    return Q.all([
        libautom8.rpc("system", "list").then(function(result) {
            console.log(INFO, "system::list");

            var systems = result.message.systems || [];
            for (var i = 0; i < systems.length; i++) {
                console.log(INFO, "  " + i + ": " + systems[i]);
            }
        }),

        libautom8.rpc("system", "select", {system: "null"}).then(function(result) {
            console.log(INFO, "system::selected");
            console.log(INFO, '  result:', result);
        }),

        libautom8.rpc("system", "selected").then(function(result) {
            console.log(INFO, "system::selected");
            console.log(INFO, '  result:', result);
        }),

        libautom8.rpc("system", "select", {system: "mochad"}).then(function(result) {
            console.log(INFO, "system::selected");
            console.log(INFO, '  result:', result);
        }),

        libautom8.rpc("system", "selected").then(function(result) {
            console.log(INFO, "system::selected");
            console.log(INFO, '  result:', result);
        })
    ]);
}

function testPreferences() {
    return Q.all([
        libautom8.rpc("server", "get_preference", {key: "fingerprint" }).then(function(result) {
            console.log(INFO, "system::get_preference(fingerprint)");
            console.log(INFO, '  result:', result);
        }),

        libautom8.rpc("server", "set_preference", {key: "port", value: "7901" }).then(function(result) {
            console.log(INFO, "system::set_preference(port)");
            console.log(INFO, '  result:', result);
        }),

        libautom8.rpc("server", "get_preference", {key: "port" }).then(function(result) {
            console.log(INFO, "system::get_preference(port)");
            console.log(INFO, '  result:', result);
        })
    ]);
}

function log_device_add_result(result) {
    console.log(INFO, "system::add_device");
    console.log(INFO, '  result:', result);
}

function log_device_delete_result(result) {
    console.log(INFO, "system::delete");
    console.log(INFO, '  result:', result);
}

function testDevices() {
    var main_entry_p2 = { label: "front door", address: "p2", groups: ["sensors"], type: 2 };
    var den_a1 = { label: "den", address: "a1", groups: ["downstairs", "den"], type: 1  };
    var living_room_floor_a2 = { label: "living room", address: "a2", groups: ["downstairs", "living room"], type: 1 };
    var living_room_piano_a3 = { label: "piano", address: "a3", groups: ["downstairs", "living room"], type: 1 };
    var office_a4 = { label: "office", address: "a4", groups: ["downstairs", "office", "late night"], type: 0 };
    var office_p3 = { label: "office motion", address: "p3", groups: ["sensors"], type: 2 };
    var master_bedroom_entry = { label: "master bedroom entry", address: "c1", groups: ["upstairs", "master bedroom"], type: 0 };

    return Q.all([
        libautom8.rpc("system", "delete_device", {address: "p2"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "a1"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "a2"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "a3"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "a4"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "p3"}).then(log_device_delete_result),
        libautom8.rpc("system", "delete_device", {address: "c1"}).then(log_device_delete_result),

        libautom8.rpc("system", "add_device", main_entry_p2).then(log_device_add_result),
        libautom8.rpc("system", "add_device", den_a1).then(log_device_add_result),
        libautom8.rpc("system", "add_device", living_room_floor_a2).then(log_device_add_result),
        libautom8.rpc("system", "add_device", living_room_piano_a3).then(log_device_add_result),
        libautom8.rpc("system", "add_device", office_a4).then(log_device_add_result),
        libautom8.rpc("system", "add_device", office_p3).then(log_device_add_result),
        libautom8.rpc("system", "add_device", master_bedroom_entry).then(log_device_add_result),

        libautom8.rpc("system", "list_devices").then(function(result) {
            console.log(INFO, "system::list_devices");
            console.log(INFO, '  result:', result);
        })
    ]);
}

function startServer() {
    return libautom8.rpc("server", "start");
}

libautom8.init()
    .then(testPreferences)
    .then(testSystem)
    .then(testDevices)
    .then(startServer);

/* poll sigint/ctrl+c exit flag... */
var exit = false;
var poller = setInterval(function() {
    if (exit) {
        console.log(ERROR, "detected exit flag, attempting shut down...");

        clearInterval(poller);
        poller = null;

        libautom8.rpc("server", "stop").then(function() {
            libautom8.deinit().then(function() {
                die(0);
            });
        });
    }
}, POLL_INTERVAL_MS_THIS_SUCKS_FIX_ME);

/* wait for ctrl+c to exit */
process.on('SIGINT', function() {
    console.log("\n\n", ERROR, "caught ctrl+c, setting exit flag (please wait a few seconds)...\n");
    exit = true; /* next time through the runloop will pick this up */

    setTimeout(function() {
        console.log(ERROR, "timed out waiting for autom8 to de-initialize. force-killing...");
        die(-1); /* whee... */
    }, DEINIT_TIMEOUT_MILLIS);
});
