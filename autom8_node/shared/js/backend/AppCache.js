(function() {
  var log = require('./Logger.js');
  var TAG = "[appcache]".yellow;

  var config = require("./Config.js").get();

  function renderAppcacheManifest(req, res) {
    log.info(TAG, 'rendering appcache (' + config.appCache.version.getTime() + ')...');

    var manifest = "CACHE MANIFEST\n";
    manifest += "# VERSION: " + config.appCache.version.getTime() + "\n\n";

    manifest += "CACHE:\n\n";
    manifest += "/socket.io/socket.io.js\n";
    manifest += "/icon.png\n\n";

    manifest += "NETWORK:\n";
    manifest += "*\n\n";

    res.writeHead(200, {
      'content-type': 'text/cache-manifest'
    });

    res.end(manifest);
  }

  function add(app) {
    app.get(/autom8.appcache/, renderAppcacheManifest);
  }

  exports = module.exports = {
    add: add
  };
}());