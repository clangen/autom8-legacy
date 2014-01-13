(function() {
  var config = { };

  exports.init = function(program) {
    config.debug = program.debug;
    config.socketDebug = false;
    config.sessionTimeout = 3600000 * 24; /* 24 hours session time, millis */
    config.allowSelfSignedCerts = true;

    config.appCache = {
      enabled: false, /* opt in via ?appcache=1 only */
      version: new Date()
    };

    config.server = {
      port: program.listen,
      pem: program.creds,
      cookieSecret: "autom84Lyfe"
    };

    config.client = {
      host: program.clienthost,
      port: program.clientport,
      password: program.clientpw
    };
  };

  exports.get = function() {
    return config;
  };
}());