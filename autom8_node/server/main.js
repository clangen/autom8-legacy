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
  require(shared + 'colors-html.js');

  var LIBRARY_PATH = path.resolve(__dirname + '/../../');

  var autom8 = require('./backend/NativeBridge.js');
  var app;

  function start() {
    config.init(program);
    config.get().client.password = "2e1cfa82b035c26cbbbdae632cea070514eb8b773f616aaeaf668e2f0be8f10d"; /* TODO FIX ME */

    /* establish binding with native layer before starting
    the http server */
    autom8.init()

    .then(function() {
      console.log(require("util").inspect(autom8));
      autom8.events.on('log', function(args) {
        /* allow clients to draw the console output */
        sessions.broadcast('recvMessage', {
          uri: 'autom8://response/libautom8/log',
          body: {html: (args || []).join(' ').toHtml()}
        });
      });

      app = httpServer.create();
      sessions.init(app); /* accept socket sessions */

      /* backend entry point for rpc call from trusted client */
      sessions.on('sendMessage', function(message, socket) {
        if (message.uri === "autom8://request/libautom8/rpc") {
          var parts = message.body;

          if (parts.id && parts.component && parts.command) {
            autom8.rpc(parts.component, parts.command, parts.options || { })

            .then(function(result) {
              result.id = parts.id;
              console.log(result);

              socket.emit('recvMessage', {
                uri: 'autom8://response/libautom8/rpc',
                body: result
              });
            });
          }
        }
      });

      app.start();
    })

    .fail(function(ex) {
      console.log('*** FATAL ***', ex);
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


