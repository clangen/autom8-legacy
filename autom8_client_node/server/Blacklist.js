(function() {
  var MAX_FAILURES = 3;
  var COOLDOWN_MILLIS = 60000;

  var blacklist = { };

  function allowConnection(req) {
    var address = req.connection.remoteAddress;
    var entry = blacklist[address];

    if (entry) {
      if (entry.failures < MAX_FAILURES) {
        return false;
      }

      var elapsed = new Date().getTime() - entry.lastAttempt;
      if (elapsed < COOLDOWN_MILLIS) {
        return false;
      }

      delete blacklist[address];
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
  }

  exports.allowConnection = allowConnection;
  exports.flagConnection = flagConnection;
}());