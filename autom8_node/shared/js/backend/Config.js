var _ = require('lodash')._;
var fs = require('fs');
var jsonminify = require('jsonminify');
var resource = require('./Resource.js');
var log = require('./Logger.js');

var TAG = "[config]";
var ONE_DAY_MILLISECONDS = 3600000 * 24;

var config;

/* default config. we'll merge in values from the external config
file during initialization */
var DEFAULT_CONFIG = {
  debug: false,

  server: {
    client: {
      proxy: {
        host: undefined,
        port: undefined,
        allowSelfSignedCerts: true
      },

      port: 7902,
      key: "../shared/conf/autom8.pem",
      cert: "../shared/conf/autom8.pem",
      enableHtml5AppCache: true,
      sessionTimeout: ONE_DAY_MILLISECONDS
    },

    admin: {
      proxy: {
        host: undefined,
        port: undefined,
        allowSelfSignedCerts: true
      },

      port: 7903,
      key: "../shared/conf/autom8.pem",
      cert: "../shared/conf/autom8.pem",
      enableHtml5AppCache: true,
      sessionTimeout: ONE_DAY_MILLISECONDS
    }
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

function Config() {
  this.__values__ = _.merge(_.cloneDeep(DEFAULT_CONFIG), loadConfigFile());
}

require('util').inherits(Config, require('events').EventEmitter);

_.extend(Config.prototype, {
  get: function(key) {
    var parts = key.split(".");
    var current = this.__values__;

    for (var i = 0; i < parts.length; i++) {
      current = current[parts[i]];
      if (current === undefined) {
        break;
      }
    }

    return _.cloneDeep(current);
  },

  set: function(key, value) {
    /* don't mutate! */
    value = _.cloneDeep(value);

    /* break the key into pieces */
    var parts = key.split(".");
    var lastKey = parts.pop();
    var tmp, target = this.__values__;

    /* find the object that is just before the last. for example,
    foo.bar.baz will give us the "foo.bar" object, so we can modify
    "baz" directly */
    for (var i = 0; i < parts.length; i++) {
      var k = parts[i];
      tmp = target[k];

      if (tmp === undefined) {
        /* create a new object entry in the namespace */
        target[k] = tmp = { };
      }
      else if (!_.isObject(tmp)) {
        /* if there's already an entry here, but it's not an object,
        then we can't nest into it. this is an error */
        throw new Error("intermediate target is not an object");
      }

      target = tmp;
    }

    /* target always needs to be a hash, because we'll end up assigning
    to target[lastKey]. */
    if (!_.isObject(target)) {
      throw new Error("target is not an object! fatal.");
    }

    /* if the specified value to update is an object, then we'll use the
    lodash merge. however, that means that the final target also needs
    to be an object. */
    if (_.isObject(value)) {
      target[lastKey] = target[lastKey] || { };

      if (!_.isObject(target[lastKey])) {
        throw new Error("target[lastKey] -- i.e. final destination -- not an obj");
      }

      _.merge(target[lastKey], value);
    }
    /* non-object setting is simple -- just replace the existing value
    with the newly specified one */
    else {
      target[lastKey] = value;
    }

    this.emit('changed', key, value);
  }
});

module.exports = new Config();