(function() {
  var TAG = "[request handlers]".yellow;

  var shared = "./../../shared/js/backend/";
  var config = require(shared + "Config.js").get();
  var blacklist = require(shared + 'Blacklist.js');

  function renderAppcacheManifest(req, res) {
    console.log(TAG, 'rendering appcache (' + config.appCache.version.getTime() + ')...');

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

  function signIn(req, res) {
    if (req.body.password === config.client.password) {
      req.session.authenticated = true;
      req.session.cookie.maxAge = config.sessionTimeout;
      res.writeHead(200);
    }
    else {
      blacklist.flagConnection(req);
      res.writeHead(401);
    }

    res.end("");
  }

  function signOut(req, res) {
    req.session.authenticated = false;
    req.session.cookie.maxAge = 0;
    res.writeHead(200);
    res.end("");
  }

  function isSignedIn(req, res) {
    var result = {signedIn: false};
    if (req.session.authenticated) {
      /* todo: better way? */
      var expires = req.session.cookie._expires;
      if (new Date(expires) - new Date() > 0) {
        result.signedIn = true;
      }
    }

    res.writeHead(result.signedIn ? 200 : 401);
    res.end(JSON.stringify(result));
  }

  function add(app) {
    app.post('/signin.action', signIn);
    app.post('/signout.action', signOut);
    app.get('/signedin.action', isSignedIn);
    app.get(/autom8.appcache/, renderAppcacheManifest);
  }

  exports = module.exports = {
    add: add
  };
}());