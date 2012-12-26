(function() {
  var config = { };

  exports.init = function(program) {
    config.debug = program.debug;
    config.sessionTimeout = 3600000 * 24; /* 24 hours session time, millis */
    config.appCacheVersion = new Date().toString();
    
    config.server = {
      port: program['listen'],
      pem: program['creds']
    };

    config.client = {
      host: program['clienthost'],
      port: program['clientport'],
      password: program['clientpw']
    };
  };

  exports.get = function() {
    return config;
  };
}());