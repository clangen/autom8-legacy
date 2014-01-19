(function() {
  var log = require('./Logger.js');

  var TAG = "[blacklist]".red;
  var MAX_FAILURES = 3;
  var COOLDOWN_MILLIS = 60000;

  var blacklist = { };

  function allowConnection(req) {
    var address = req.connection.remoteAddress;
    var entry = blacklist[address];

    if (entry) {
      var elapsed = new Date().getTime() - entry.lastAttempt;
      if (entry.failures > MAX_FAILURES && elapsed < COOLDOWN_MILLIS) {
        log.error(TAG, "denied access for " + address + ". too many bad auth attempts.");
        return false;
      }

      if (elapsed > COOLDOWN_MILLIS) {
        log.warn(TAG, "cooldown complete for", address);
        delete blacklist[address]; /* cooldown complete */
      }
    }

    return true;
  }

  function flagConnection(req) {
    var address = req.connection.remoteAddress;
    var entry = blacklist[address];
    var now = new Date().getTime();

    entry = entry || { failures: 0 };
    entry.failures++;
    entry.lastAttempt = now;

    blacklist[address] = entry;

    log.warn(TAG, "client with address", address, "flagged with", entry.failures, "bad attempts");
  }

  exports.allowConnection = allowConnection;
  exports.flagConnection = flagConnection;
  exports.TAG = TAG;
}());
