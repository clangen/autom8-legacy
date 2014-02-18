(function() {
  var log = require('./Logger.js');
  var TAG = "[app cache generator]".yellow;

  var config = require("./Config.js").get();

  function renderAppcacheManifest(req, res) {
    var version = (config.appCache.version ? config.appCache.version.getTime() : 0);
    log.info(TAG, 'rendering appcache (' + version + ')...');

    var manifest = "CACHE MANIFEST\n";
    manifest += "# VERSION: " + version + "\n\n";

    manifest += "CACHE:\n\n";
    manifest += "/socket.io/socket.io.js\n";
    manifest += "/icon.png\n";
    manifest += "/favicon.ico\n\n";

    manifest += "NETWORK:\n";
    manifest += "debug.html\n";
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