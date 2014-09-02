debugger;
var server = require('./program.js').init();

server.start()

.then(function() {
	debugger;
})

.fail(function() {
	debugger;
})