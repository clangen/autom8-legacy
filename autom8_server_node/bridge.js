var ffi = require('ffi');
var ref = require('ref');
var path = require('path');
require('colors');

var LOCAL_LOG = "[local log]".grey;
var SERVER_LOG = "[server log]".magenta;
var RPC_SEND = "[rpc send]".yellow;
var RPC_RECV = "[rpc recv]".green;

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

// console.log(dll);

console.log("\n------------------------------------------------------------\n".green);
console.log(LOCAL_LOG, "loaded libautom8.dll");
console.log(LOCAL_LOG, "initializing:", dll.autom8_init());
console.log(LOCAL_LOG, "version:", dll.autom8_version());

var util = {
	initLogging: function() {
		var levels = {
			'0': '[i]',
			'1': '[w]',
			'2': '[e]'
		};

		var log = function(level, tag, message) {
			console.log(SERVER_LOG, "[" + tag + "]" + levels[level] + " " + message);
		};

		var logCallback = ffi.Callback('void', ['int', 'string', 'string'], log);

		dll.autom8_set_logger(logCallback);
		console.log(LOCAL_LOG, "registered logger");
	},

	makeRpcCall: function(component, command, options, callback) {
		var rpcCallback = ffi.Callback('void', ['string'], function(result) {
			console.log(RPC_RECV, result);
			(callback || noOp)(result);
		});

		var payload = JSON.stringify({
			"component": component,
			"command": command,
			"options": options
		});

		console.log(RPC_SEND, payload);
		dll.autom8_rpc(payload, rpcCallback);
	}
};

util.initLogging();

util.makeRpcCall("server", "start", { }, function(result) {
	console.log(LOCAL_LOG, "start server result:", JSON.parse(result));
});

// dll.autom8_server_start();

setTimeout(function() {
	util.makeRpcCall("server", "stop");
	console.log(LOCAL_LOG, "deinitializing:", dll.autom8_deinit());
}, 5000);
