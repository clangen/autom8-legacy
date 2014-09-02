var _ = require('lodash')._;
var Q = require('q');
var path = require('path');

var SHARED_DIR = "./../../shared/js/backend/";
var SERVER_DIR = __dirname + "/../../client/";
var TAG = "[client-server-local]".yellow;

var config = require(SHARED_DIR + 'Config.js');
var log = require(SHARED_DIR + 'Logger.js');
var clientServer;

function stop() {
  if (clientServer) {
    return clientServer.stop();
  }

  var d = Q.defer();
  d.resolve();
  return d.promise;
}

function restart() {
  var deferred = Q.defer();

  stop()

  .then(function() {
    if (!clientServer) {
      var program = require(SERVER_DIR + "program.js");
      var clientConfig = config.get("server.client");
      var debug = config.get("debug");

      clientServer = program.init({
        clienthost: '127.0.0.1',
        clientport: clientConfig.proxy.port,
        clientpw: clientConfig.proxy.password,
        cert: clientConfig.cert,
        key: clientConfig.key,
        listen: clientConfig.port,
        debug: debug
      });
    }

    log.info(TAG, "connecting...");

    clientServer.start()

    .then(function() {
      deferred.resolve();
    })

    .fail(function(err) {
      deferred.reject(err);
    });
  })

  .fail(function() {
    log.error(TAG, "connect failed");
    deferred.reject();
  });

  return deferred.promise;
}

exports.stop = stop;
exports.restart = restart;
