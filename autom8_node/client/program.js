require('colors');

var VERSION = "0.5.4";
var SHARED_DIR = "./../shared/js/backend/";

var _ = require('lodash')._;
var Q = require('q');

var config = require(SHARED_DIR + 'Config.js');
var HttpServer = require(SHARED_DIR + 'HttpServer.js');

var app;

function initHeadless(options) {
  options = options || { };

  var dieAfterMillis = 7000;
  var heartbeatTimeout = null;

  var dieIfNoHeartbeat = function() {
    console.log("*** FATAL *** controlling program unresponsive, exiting...".red);
    process.exit(101);
  };

  heartbeatTimeout = setTimeout(dieIfNoHeartbeat, dieAfterMillis);

  process.on('message', function(m) {
    switch (m.name) {
      case "password":
        var password = m.options.value;
        config.set("server.client.password", password);
        config.set("server.client.proxy.password", password);
        app.start();
        break;

      case "heartbeat":
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = setTimeout(dieIfNoHeartbeat, dieAfterMillis);
        break;

      case "die":
        process.exit(102);
        break;
    }
  });
}

exports.init = function(options) {
  if (app) {
    throw new Error("init called but already initialized...");
  }

  /* if options aren't explicitly supplied, try to parse them from the command line */
  if (!options) {
    options = require('commander')
      .version(VERSION)
      .usage('params:')
      .option('--listen <port>', 'port we will listen on', Number, 7902)
      .option('--key <pem>', 'pem file containing the private key used for the https server', String)
      .option('--cert <pem>', 'pem file containing the cert to use for the https server', String)
      .option('--clienthost <hostname>', 'autom8 server to connect to', String, "127.0.0.1")
      .option('--clientport <port>', 'port the autom8 server is listening on', Number, 7901)
      .option('--clientpw <password hash>', 'password for the autom8 server')
      .option('--headless', 'instance will be controlled via node/IPC', Boolean, false)
      .option('--debug', 'enable verbose debug output', Boolean, false)
      .parse(process.argv);

      config.set("debug", options.debug);
  }

  /* validate input */
  if (!options.clienthost || !options.clientport || !options.clientpw) {
    throw new Error("--clienthost, --clientport, or --clientpw not supplied");
  }

  /* update our config from input arguments. */
  config.set("server.client", {
    proxy: {
      host: options.clienthost,
      port: options.clientport,
      password: options.clientpw
    },

    key: options.key,
    cert: options.cert,
    port: options.listen,
    password: options.clientpw
  });

  /* create the server instance. */
  app = HttpServer.create({
    directory: __dirname,
    configKey: "server.client"
  });

  /* in headless mode we run as a fork'd node node process so we have
  a special communication channel. this channel is used for password
  communication and keep-alive heartbeats */
  if (options.headless) {
    initHeadless(options);
  }

  return app;
};

exports.instance = function() {
  return app;
};