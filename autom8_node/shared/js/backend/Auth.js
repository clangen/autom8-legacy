var TAG = "[web-socket-auth]".yellow;
var blacklist = require('./Blacklist.js');

function add(app) {
  var signIn = function(req, res) {
    if (req.body.password === app.config.proxy.password) {
      req.session.authenticated = true;
      req.session.cookie.maxAge = app.config.sessionTimeout;
      res.writeHead(200);
    }
    else {
      blacklist.flagConnection(req);
      res.writeHead(401);
    }

    res.end("");
  };

  var signOut = function(req, res) {
    req.session.authenticated = false;
    req.session.cookie.maxAge = 0;
    res.writeHead(200);
    res.end("");
  };

  var isSignedIn = function(req, res) {
    var result = { signedIn: false };
    if (req.session.authenticated) {
      /* todo: better way? */
      var expires = req.session.cookie._expires;
      if (new Date(expires) - new Date() > 0) {
        result.signedIn = true;
      }
    }

    res.writeHead(result.signedIn ? 200 : 401);
    res.end(JSON.stringify(result));
  };

  app.express.post('/signin.action', signIn);
  app.express.post('/signout.action', signOut);
  app.express.get('/signedin.action', isSignedIn);
}

exports = module.exports = {
  addRequestHandler: add
};
