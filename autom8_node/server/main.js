// npm install commander express socket.io socket.io-client less closurecompiler clean-css prompt
// node.exe main.js --listen 7903 --creds ../shared/conf/autom8.pem --debug

(function() {
  var program = require('commander');

  var shared = "./../shared/js/backend/";
  var config = require(shared + 'Config.js');
  var httpServer = require(shared + 'HttpServer.js');
  var util = require(shared + 'Util.js');
  var sessions = require(shared + 'Sessions.js');

  // var prompt = require('prompt');
  // prompt.message = "autom8-server";
  // prompt.start();

  function start() {
    config.init(program);

    // sessions.on('sendMessage', function(message) {
    //   clientProxy.send(message.uri, message.body);
    // });

    var app = httpServer.create();
    // handlers.add(app);
    // sessions.init(app);
    app.start();
  }

  program
    .version("0.3.2")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on')
    .option('--creds <pem>', 'pem file containing both cert and private key')
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  start();
}());


