(function() {
  var TAG = "[web socket auth]".yellow;

  var config = require("./Config.js").get();
  var blacklist = require('./Blacklist.js');

  function signIn(req, res) {
    if (req.body.password === config.clientProxy.password) {
      req.session.authenticated = true;
      req.session.cookie.maxAge = config.server.sessionTimeout;
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
  }

  exports = module.exports = {
    add: add
  };
}());