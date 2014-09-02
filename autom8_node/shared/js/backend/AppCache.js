var log = require('./Logger.js');

var TAG = "[app cache generator]".yellow;

function renderAppcacheManifest(req, res) {
  var version = Date.now().toString();
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

function addRequestHandler(app) {
  app.express.get(/autom8.appcache/, renderAppcacheManifest);
}

exports = module.exports = {
  addRequestHandler: addRequestHandler
};