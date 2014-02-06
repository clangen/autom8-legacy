// npm install commander express socket.io socket.io-client less closurecompiler clean-css prompt ent
// node.exe main.js --listen 7903 --creds ../shared/conf/autom8.pem --debug

(function() {
  var shared = "./../shared/js/backend/";

  require('colors');
  require(shared + 'colors-html.js');

  var Q = require('q');
  var path = require('path');
  var program = require('commander');
  var config = require(shared + 'Config.js');
  var httpServer = require(shared + 'HttpServer.js');
  var util = require(shared + 'Util.js');
  var clientProxy = require(shared + 'ClientProxy.js').create();
  var sessions = clientProxy.sessions;
  var log = require(shared + 'Logger.js');

  var LIBRARY_PATH = path.resolve(__dirname + '/../../');
  var DEFAULT_PASSWORD = "2e1cfa82b035c26cbbbdae632cea070514eb8b773f616aaeaf668e2f0be8f10d"; /* "empty" */

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
    })

    .then(function() {
      clientProxy.connect();
    });
  }

  function start() {
    config.init(program);
    config.get().client.password = DEFAULT_PASSWORD;
    config.get().client.host = "localhost";
    config.get().client.port = 7901;

    /* establish binding with native layer before starting
    the http server... */
    autom8.init()

    /* set current password. note that the user can use the server
    to change the password or port while it's running -- see below
    for the special case where it's recached */
    .then(function() {
      Q.all([
        autom8.rpc("server", "get_preference", {key: "password"}),
        autom8.rpc("server", "get_preference", {key: "port"})
      ])

      .spread(function(pw, port) {
        if (pw && pw.status === 1 && pw.message && pw.message.value) {
          config.get().client.password = pw.message.value;
        }

        if (port && port.status === 1 && port.message && port.message.value) {
          config.get().client.port = parseInt(port.message.value, 10);
        }
      });
    })

    .then(function() {
      startServerIfDevicesConnected();

      app = httpServer.create();

      sessions.init(app); /* accept socket sessions */

      /* for new log entries, broadcast them individually */
      log.on('log', function(args) {
        sessions.broadcast('recvMessage', {
          uri: 'autom8://response/libautom8/log',
          body: {html: encodeLog(args)}
        });
      });

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

              /* annoying special case: if the user is setting the password or port,
              we want to update our internal config upon success so the client can
              automatically reconnect when the server is restarted */
              if (parts.component === "server" &&
                  parts.command === "set_preference" &&
                  result.status === 1 /* AUTOM8_OK */)
              {
                  if (parts.options.key === "password") {
                    config.get().client.password = parts.options.value;
                  }
                  else if (parts.options.key === "port") {
                    config.get().client.port = parseInt(parts.options.value, 10);
                  }
              }

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
      console.log('*** FATAL ***'.red, ex, ex.stack);
    });
  }

  program
    .version("0.6.1")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on', Number, 7903)
    .option('--creds <pem>', 'pem file containing both cert and private key', String, "../shared/conf/autom8.pem")
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  start();
}());