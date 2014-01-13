// npm install commander express socket.io socket.io-client less closurecompiler clean-css prompt
// node.exe main.js --listen 7903 --creds ../shared/conf/autom8.pem --debug

(function() {
  var path = require('path');

  var program = require('commander');
  require('colors');

  var shared = "./../shared/js/backend/";
  var config = require(shared + 'Config.js');
  var httpServer = require(shared + 'HttpServer.js');
  var util = require(shared + 'Util.js');
  var sessions = require(shared + 'Sessions.js');

  var LIBRARY_PATH = path.resolve(__dirname + '/../../');

  var autom8 = require('./backend/NativeBridge.js');
  var app;

  function start() {
    config.init(program);
    config.get().client.password = "2e1cfa82b035c26cbbbdae632cea070514eb8b773f616aaeaf668e2f0be8f10d"; /* TODO FIX ME */

    /* establish binding with native layer before starting
    the http server */
    autom8.init().then(function() {
      app = httpServer.create();
      sessions.init(app); /* accept socket sessions */

      /* backend entry point for rpc call from trusted client */
      sessions.on('sendMessage', function(request) {
        console.log(JSON.stringify(request));
      });

      app.start();
    });
  }

  program
    .version("0.6.0")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on')
    .option('--creds <pem>', 'pem file containing both cert and private key')
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  start();
}());


