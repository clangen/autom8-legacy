(function() {
  var config = { };

  exports.init = function(program) {
    config.debug = program.debug;
    config.socketDebug = false;

    config.server = {
      port: program.listen,
      key: program.key,
      cert: program.cert,
      enableHtml5AppCache: true,
      sessionTimeout: 3600000 * 24 /* 24 hours session time, millis */
    };

    config.clientProxy = {
      host: program.clienthost,
      port: program.clientport,
      allowSelfSignedCerts: true,
      password: program.clientpw
    };
  };

  exports.get = function() {
    return config;
  };
}());