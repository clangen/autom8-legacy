// npm install commander express socket.io socket.io-client less closurecompiler clean-css prompt ent
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
  var log = require(shared + 'Logger.js');
  require(shared + 'colors-html.js');

  var LIBRARY_PATH = path.resolve(__dirname + '/../../');

  var autom8 = require('./backend/NativeBridge.js');

  var app;

  /* we'll replay the last 100 logs for every connected
  client so they can see what's going on */
  var MAX_LOGS = 100;
  var recentLogs = [];

  function encodeLog(args) {
    args[0] = '<span class="timestamp">' + args[0] + '</span>';
    var result = '<div class="log-entry">';
    for (var i = 0; i < args.length; i++) {
      result += args[i].toString().toHtml();
    }
    result += "</div>";

    recentLogs.push(result);
    if (recentLogs.length > 100) {
      recentLogs.shift();
    }

    return result;
  }

  function startServerIfDevicesConnected() {
    autom8.rpc("system", "list_devices", { }).then(function(result) {
      var msg = result && result.message;
      if (msg && msg.devices && msg.devices.length) {
        autom8.rpc("server", "start", { });
      }
    });
  }

  function start() {
    config.init(program);
    config.get().client.password = "2e1cfa82b035c26cbbbdae632cea070514eb8b773f616aaeaf668e2f0be8f10d"; /* TODO FIX ME */

    /* establish binding with native layer before starting
    the http server */
    autom8.init()

    .then(function() {
      startServerIfDevicesConnected();

      /* for new log entries, broadcast them individually */
      log.on('log', function(args) {
        sessions.broadcast('recvMessage', {
          uri: 'autom8://response/libautom8/log',
          body: {html: encodeLog(args)}
        });
      });

      app = httpServer.create();

      sessions.init(app); /* accept socket sessions */

      sessions.events.on('connection', function(socket) {
        /* when a new session is connected, send the most recent
        log entries */
        socket.emit('recvMessage', {
          uri: 'autom8://response/libautom8/log',
          body: {html: recentLogs}
        });
      });

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
    .option('--listen <port>', 'port we will listen on', Number, 7903)
    .option('--creds <pem>', 'pem file containing both cert and private key', String, "../shared/conf/autom8.pem")
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  start();
}());


