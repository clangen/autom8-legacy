var SHARED_DIR = "./../shared/js/backend/";
var DEFAULT_PASSWORD = "2e1cfa82b035c26cbbbdae632cea070514eb8b773f616aaeaf668e2f0be8f10d"; /* "empty" */
var TAG = "[server.program]".yellow;

require('colors');
require(SHARED_DIR + 'colors-html.js');

var Q = require('q');
var path = require('path');

var config = require(SHARED_DIR + 'Config.js');
var log = require(SHARED_DIR + 'Logger.js');
var HttpServer = require(SHARED_DIR + 'HttpServer.js');
var ClientProxy = require(SHARED_DIR + 'ClientProxy.js');

var nativeBridge = require('./backend/NativeBridge.js');

var adminApp;
var clientApp;

/* set of rpc commands that should trigger client resyncs */
var RESYNC_ON = {
  'server.start': true,
  'server.stop': true,
  'system.select': true,
  'system.set_preference': true
};

/*
 *
 * SERVICE CONTROL
 * (starting and stopping low-level, client, and admin servers)
 *
 */

function startNonAdminServersIfDeviceConnected() {
  return stopNonAdminServers()

  .then(function() {
    return nativeBridge.rpc("system", "list_devices", { })

    .then(function(result) {
      var msg = result && result.message;
      if (msg && msg.devices && msg.devices.length) {
        return startNonAdminServers();
      }
    });
  });
}

function startNonAdminServers() {
  var deferred = Q.defer();

  stopClientServer()
  .then(stopLowLevelServer)
  .then(reloadPreferences)
  .then(startLowLevelServer)
  .then(startClientServer)

  .then(function() {
    deferred.resolve();
  })

  .fail(function(ex) {
    deferred.reject(ex);
  });

  return deferred.promise;
}

function stopNonAdminServers() {
  return stopClientServer().then(stopLowLevelServer);
}

function stopLowLevelServer() {
  return nativeBridge.rpc("server", "stop", { });
}

function startLowLevelServer() {
  return nativeBridge.rpc("server", "start", { });
}

function startClientServer() {
  return clientApp.start();
}

function stopClientServer() {
  return clientApp.stop();
}

function startAdminApp() {
  return adminApp.start();
}

function stopAdminApp() {
  return adminApp.stop();
}

function reloadPreferences() {
  return Q.all([
    nativeBridge.rpc("server", "get_preference", {key: "password"}),
    nativeBridge.rpc("server", "get_preference", {key: "port"}),
    nativeBridge.rpc("server", "get_preference", {key: "webClientPort"})
  ])

  .spread(function(pw, port, webClientPort) {
    var proxy = { };
    var admin = { };
    var client = { };

    if (pw && pw.status === 1 && pw.message && pw.message.value) {
      pw = pw.message.value;
    }
    else {
      pw = DEFAULT_PASSWORD;
    }

    proxy.password = pw;

    if (port && port.status === 1 && port.message && port.message.value) {
      proxy.port = parseInt(port.message.value, 10);
    }

    if (webClientPort && webClientPort.status === 1 && webClientPort.message && webClientPort.message.value) {
      admin.webClientPort = parseInt(webClientPort.message.value, 10);
    }

    config.set("server.admin", admin);
    config.set("server.client", client);
    config.set("server.admin.proxy", proxy);
    config.set("server.client.proxy", proxy);
  });
}

/*
 *
 * LOGGING RELAY (libatuom8, Logger.js -> adminApp web ui)
 *
 */

var MAX_LOGS = 100;
var recentLogs = [];

function encodeLog(args) { /* ick, this could be a lot better */
  args = args.slice(); /* don't modify the input; clone the array */
  args[0] = '<span class="timestamp">' + args[0] + '</span>';
  var result = '<div class="log-entry">';
  for (var i = 0; i < args.length; i++) {
    if (args[i]) {
      result += args[i].toString().toHtml();
    }
  }
  result += "</div>";

  recentLogs.push(result);
  if (recentLogs.length > 100) {
    recentLogs.shift();
  }

  return result;
}

/* when a new log entry is written, relay it to all clients
using the admin interface */
log.on('log', function(args) {
  if (adminApp && adminApp.sessions) {
    adminApp.sessions.broadcast('recvMessage', {
      uri: 'autom8://response/libautom8/log',
      body: { html: encodeLog(args) }
    });
  }
});

function initializeLoggingRelay() {
  /* when a new session is connected, send the most recent
  log entries to the client */
  adminApp.sessions.on('connection', function(socket) {
    socket.emit('recvMessage', {
      uri: 'autom8://response/libautom8/log',
      body: {html: recentLogs}
    });
  });
}

/*
 *
 * NATIVE MESSAGE RELAY (admin web client -> libautom8.dll)
 *
 */

function sendMessageOverNativeBridge(parts, socket) {
  return nativeBridge.rpc(parts.component, parts.command, parts.options)

  .then(function(result) {
    result.id = parts.id;

    /* annoying special case: if the user is setting the password or port,
    we want to update our internal config upon success so the client can
    automatically reconnect without needing to restart the server process. */
    if (parts.component === "server" &&
        result.status === 1 /* AUTOM8_OK */)
    {
        if (parts.command === "set_preference") {
          if (parts.options.key === "password") {
            config.set("server.admin.proxy.password", parts.options.value);
            config.set("server.client.proxy.password", parts.options.value);
          }
          else if (parts.options.key === "port") {
            config.set("server.admin.proxy.port", parseInt(parts.options.value, 10));
            config.set("server.client.proxy.port", parseInt(parts.options.value, 10));
          }
        }
    }

    /* after post-processing has completed, relay the message back to the
    server ui so it can redraw. */
    socket.emit('recvMessage', {
      uri: 'autom8://response/libautom8/rpc',
      body: result
    });
  })

  .fail(function(ex) {
    log.error(TAG, '*** RPC call failed ***'.red, ex, ex.stack);
  });
}

function initializeNativeBridgeRelay() {
  /* snoop all the incoming messages from our admin web clients.
  if they are of autom8://request/libautom8/rpc, then we will
  relay them to the underlying libautom8.dll. by doing this, the
  web clients can directly control the native server components */
  adminApp.sessions.onMessage('sendMessage', function(message, socket) {
    if (message.uri === "autom8://request/libautom8/rpc") {
      var promise;
      var parts = message.body;

      if (parts.id && parts.component && parts.command) {
        /* we intercept and handle the stop and start commands ourselves, because
        there are other servers we need to start/stop as well */
        if (parts.component === "server" &&
            (parts.command === "stop") || (parts.command === "start"))
        {
          if (parts.command === "stop") {
            promise = stopNonAdminServers();
          }
          else if (parts.command === "start") {
            promise = startNonAdminServers();
          }
        }
        /* other than start and stop, we allow all other commands to be sent to the
        rpc engine so it can be processed by the native library. below, in a couple
        cases, we will do a bit of post-processing, mainly to refresh local pref vars */
        else {
          promise = sendMessageOverNativeBridge(parts, socket);
        }

        promise.then(function() {
          /* let all connected admin clients know that someone has been mucking around
          with the server settings, so they should schedule a redraw */
          if (RESYNC_ON[parts.component + '.' + parts.command]) {
            var message = {
              uri: 'autom8://response/libautom8/resync',
              body: JSON.stringify({
                component: parts.component,
                command: parts.command
              })
            };

            adminApp.sessions.broadcast('recvMessage', message);
          }
        });
      }
    }
  });
}


/*
 *
 * INITIALIZATION, STARTUP, SHUTDOWN
 *
 */

function start(options) {
  /* bootstrap by initializing the native layer, reloading preferences,
  and starting up the client servers if any devices are connected
  to the selected system. note: it's safe to do all of this before the
  server http server is started */
  return nativeBridge.init()
  .then(stop)
  .then(reloadPreferences)
  .then(startNonAdminServersIfDeviceConnected)
  .then(startAdminApp)

  .then(function() {
    initializeLoggingRelay();
    initializeNativeBridgeRelay();
  })

  .fail(function(ex) {
    log.error(TAG, '*** ERROR during server start. stopping everything... ***'.red);
    stop();

    /* use a bit of (kind of ugly) heuristics to determine which component
    failed during startup. the HttpServer instances will always tack on a
    "configKey" to the exception, so use that if it exists. if there's a
    failure starting the native server from the dll then there will be both
    a "request" and "response" fields. otherwise... who knows? */
    var component = ex.configKey;
    if (!component) {
      component = (ex.request && ex.response) ? "server.native" : "unknown";
    }

    throw { error: ex, component: component };
  });
}

function stop() {
  return stopAdminApp().then(stopClientServer).then(stopLowLevelServer);
}

exports.init = function(options) {
  if (clientApp || adminApp) {
    throw new Error("init called but already started...");
  }

  if (!options) {
    options = require('commander')
      .version("0.6.1")
      .usage('params:')
      .option('--listen <port>', 'port we will listen on (default 7903)', Number, 7903)
      .option('--key <pem>', 'pem file containing the private key used for the https server', String)
      .option('--cert <pem>', 'pem file containing the cert to use for the https server', String)
      .option('--debug', 'enable verbose debug output')
      .parse(process.argv);

    config.set("debug", options.debug);
  }

  config.set("server.admin", {
    proxy: {
      port:  7901,
      host: "localhost",
    },

    port: options.listen,
    key: options.key,
    cert: options.cert,
  });

  config.set("server.client", {
    proxy: {
      port:  7901,
      host: "localhost",
    },

    port: 7902,
    key: options.key,
    cert: options.cert,
  });

  adminApp = HttpServer.create({
    directory: __dirname,
    configKey: "server.admin"
  });

  clientApp = HttpServer.create({
    directory: path.resolve(__dirname + '/../client'),
    configKey: "server.client"
  });

  return {
    start: start,
    stop: stop
  };
};

/*
 *
 * PROCESS-WIDE HANDLING
 *
 */

process.on('exit', function() {
  stop();
});

process.on('uncaughtException', function(ex) {
  log.error(TAG, ex, ex.stack);
  process.exit(256);
});
