var log = require('./Logger.js');

var TAG = "[app cache generator]".yellow;
var VERSION = Date.now();

function renderAppcacheManifest(req, res) {
  var version = Date.now().toString();
  log.info(TAG, 'rendering appcache (' + VERSION + ')...');

  var manifest = "CACHE MANIFEST\n";
  manifest += "# VERSION: " + VERSION + "\n\n";

  manifest += "CACHE:\n\n";
  manifest += "/socket.io/socket.io.js\n";
  manifest += "/icon.png\n";
  manifest += "/favicon.ico\n";
  manifest += "/js/main.js\n";
  manifest += "/css/main.css\n\n";

  manifest += "NETWORK:\n\n";
  manifest += "*\n\n";

  res.writeHead(200, {
    'content-type': 'text/cache-manifest'
  });

  res.end(manifest);
}

function addRequestHandler(app) {
  app.express.get(/app.cache/, renderAppcacheManifest);
}

exports = module.exports = {
  addRequestHandler: addRequestHandler
};