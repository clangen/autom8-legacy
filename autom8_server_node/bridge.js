var ffi = require('ffi');
var path = require('path');

var dllDir = path.resolve(__dirname + '/../Release');
process.chdir(dllDir);

var dllFile = dllDir + "/libautom8";

var dll = ffi.Library(dllFile, {
	"autom8_version": ['string', []],
	"autom8_set_logger": ['void', ['pointer']],
	"autom8_server_start": ['int', []],
	"autom8_server_stop": ['int', []]
});

var log = function(level, tag, message) {
	console.log("--> [" + level + "] [" + tag + "] " + message);
};

var logCallback = ffi.Callback('void', ['int', 'string', 'string'], log);

console.log("loaded libautom8.dll");
console.log("version:", dll.autom8_version());

dll.autom8_set_logger(logCallback);
console.log("registered logger");

dll.autom8_server_start();

setTimeout(function() {
	dll.autom8_server_stop();
}, 2000);
