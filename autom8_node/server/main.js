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
  var clientServerWrapper = require('./backend/ClientServerWrapper.js');

  var app;

  /* set of rpc commands that should trigger client resyncs */
  var RESYNC_ON = {
    'server.start': true,
    'server.stop': true,
    'system.select': true,
    'system.set_preference': true
  };

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

  clientProxy.setInvalidPasswordCallback(function() {
    /* do nothing! by default ClientProxy will terminate the application,
    but we don't want that to happen in this case */
  });

  function startAllServers() {
    var deferred = Q.defer();

    stopAllServers().then(reloadPreferences())

    .then(function() {
      autom8.rpc("server", "start", { })

      .then(function(result) {
        clientProxy.reconnect({
          delay: 1000,
          port: config.get().client.webClientPort
        });

        clientServerWrapper.restart();

        deferred.resolve(result);
      });
    })

    .fail(function(ex) {
      deferred.reject(ex);
    });

    return deferred.promise;
  }

  function stopAllServers() {
    return Q.all([
      clientProxy.disconnect(),
      clientServerWrapper.stop()
    ])

    .spread(function() {
      return autom8.rpc("server", "stop", { });
    });
  }

  function startAllServersIfDevicesConnected() {
    return stopAllServers()

    .then(function() {
      return autom8.rpc("system", "list_devices", { })

      .then(function(result) {
        var msg = result && result.message;
        if (msg && msg.devices && msg.devices.length) {
          return startAllServers();
        }
      });
    });
  }

  function reloadPreferences() {
    return Q.all([
      autom8.rpc("server", "get_preference", {key: "password"}),
      autom8.rpc("server", "get_preference", {key: "port"}),
      autom8.rpc("server", "get_preference", {key: "webClientPort"})
    ])

    .spread(function(pw, port, webClientPort) {
      config.get().client.password = DEFAULT_PASSWORD;
      config.get().client.host = "localhost";
      config.get().client.port = 7901;
      config.get().client.webClientPort = 7902;

      if (pw && pw.status === 1 && pw.message && pw.message.value) {
        config.get().client.password = pw.message.value;
      }

      if (port && port.status === 1 && port.message && port.message.value) {
        config.get().client.port = parseInt(port.message.value, 10);
      }

      if (webClientPort && webClientPort.status === 1 && webClientPort.message && webClientPort.message.value) {
        config.get().client.webClientPort = parseInt(webClientPort.message.value, 10);
      }
    });
  }

  function start() {
    config.init(program);

    /* bootstrap by initializing the native layer, reloading preferences,
    and starting up the client servers if any devices are connected
    to the selected system. note: it's safe to do all of this before the
    server http server is started */
    autom8.init()
    .then(reloadPreferences())
    .then(startAllServersIfDevicesConnected())

    .then(function() {
      app = httpServer.create();

      /* accept web socket connections so we can transmit logs to the
      server ui in real time */
      sessions.init(app);

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
            var promise;

            /* we intercept and handle the stop and start commands ourselves, because
            there are other servers we need to start/stop as well */
            if (parts.component === "server" &&
                (parts.command === "stop") || (parts.command === "start"))
            {
              if (parts.command === "stop") {
                promise = stopAllServers();
              }
              else if (parts.command === "start") {
                promise = startAllServers();
              }
            }
            /* other than start and stop, we allow all other commands to be sent to the
            rpc engine so it can be processed by the native library. below, in a couple
            cases, we will do a bit of post-processing, mainly to refresh local pref vars */
            else {
              promise = autom8.rpc(parts.component, parts.command, parts.options || { });
            }

            promise.then(function(result) {
              result.id = parts.id;

              /* annoying special case: if the user is setting the password or port,
              we want to update our internal config upon success so the client can
              automatically reconnect when the server is restarted */
              if (parts.component === "server" &&
                  result.status === 1 /* AUTOM8_OK */)
              {
                  if (parts.command === "set_preference") {
                    if (parts.options.key === "password") {
                      config.get().client.password = parts.options.value;
                    }
                    else if (parts.options.key === "port") {
                      config.get().client.port = parseInt(parts.options.value, 10);
                    }
                  }
              }

              /* after post-processing has completed, relay the message back to the
              server ui */
              socket.emit('recvMessage', {
                uri: 'autom8://response/libautom8/rpc',
                body: result
              });

              /* let other connected clients know that someone has been mucking around
              with the server settings, so they should schedule a redraw */
              if (RESYNC_ON[parts.component + '.' + parts.command]) {
                var message = {
                  uri: 'autom8://response/libautom8/resync',
                  body: JSON.stringify({
                    component: parts.component,
                    command: parts.command
                  })
                };

                sessions.broadcast('recvMessage', message, {exclude: socket.id});
              }
            })

            .fail(function(ex) {
              console.log('*** RPC call failed ***'.red, ex, ex.stack);
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

  process.on('exit', function() {
    clientServerWrapper.stop();
  });

  process.on('uncaughtException', function(ex) {
    console.log(ex);
    process.exit(256);
  });

  program
    .version("0.6.1")
    .usage('params:')
    .option('--listen <port>', 'port we will listen on', Number, 7903)
    .option('--creds <pem>', 'pem file containing both cert and private key', String, "../shared/conf/autom8.pem")
    .option('--debug', 'enable verbose debug output', Boolean, false)
    .parse(process.argv);

  start();
}());