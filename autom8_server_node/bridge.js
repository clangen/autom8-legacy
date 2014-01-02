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

util.makeRpcCall("server", "start");

setTimeout(function() {
	util.makeRpcCall("server", "stop", { }, function() {
		console.log(LOCAL_LOG, "autom8_deinit:", dll.autom8_deinit());
		process.exit(0);
	});

	setTimeout(function() {
		console.log(ERROR_LOG, "timed out waiting for autom8 to de-initialize");
		process.exit(-1);
	}, DEINIT_TIMEOUT_MILLIS);
}, 5000);
