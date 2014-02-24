var _ = require('lodash')._;
var fs = require('fs');
var jsonminify = require('jsonminify');
var resource = require('./Resource.js');
var log = require('./Logger.js');

var TAG = "[config]";

/* default config. not much here! we will start with this basic
structure, then merge values from file and command-line args */
var config = {
  debug: false,
  socketDebug: false,

  server: {
    port: 7903,
    enableHtml5AppCache: true,
    key: "../shared/conf/autom8.pem",
    cert: "../shared/conf/autom8.pem",
    sessionTimeout: 3600000 * 24 /* 24 hours session time, millis */
  },

  clientProxy: {
    allowSelfSignedCerts: true
  }
};

/* resolve the user's config file, and merge it into our default
config structure */
function loadConfigFile() {
  var configFile = resource.resolve('conf', 'config.json');
  if (configFile) {
    try {
      /* jsonminify will remove comments from the string before it's parsed */
      return JSON.parse(jsonminify(fs.readFileSync(configFile).toString()));
    }
    catch (e) {
      log.error(TAG, "failed to parse config file at", resource.resolve('conf', 'config.json'),
        "\n\nwhile config.json *does* allow for comments, please ensure that\n  (1) all keys are",
        "strings\n  (2) there are no trailing commas\n  (3) the value 'undefined' is not used.",
        "\n\nautom8 will not start until config.json is valid. exiting now.");

      process.exit(1);
    }
  }

  return { };
}

exports.init = function(argv) {
  /* merge precedence (low to high): default, config file, cli */
  config = _.merge(config, loadConfigFile(), {
    debug: argv.debug,

    server: {
      port: argv.listen,
      key: argv.key,
      cert: argv.cert,
    },

    clientProxy: {
      host: argv.clienthost,
      port: argv.clientport,
      password: argv.clientpw
    }
  });
};

exports.get = function() {
  return config;
};
