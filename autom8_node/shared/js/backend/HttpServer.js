var _ = require('lodash')._;
var Q = require('q');
var fs = require('fs');
var url = require('url');
var zlib = require('zlib');
var path = require('path');
var https = require('https');

var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var util = require('./Util.js');
var blacklist = require('./Blacklist.js');
var resource = require('./Resource.js');
var config = require('./Config.js');
var log = require('./Logger.js');
var ClientProxy = require('./ClientProxy.js');
var Sessions = require ('./Sessions.js');

var TAG = "[HttpServer]".blue;
var COOKIE_SECRET = "autom84Lyfe";
var BLACKLISTED_PAGE = fs.readFileSync(__dirname + '/static/blacklisted.html').toString("utf-8");

var DEBUG_CONNECTIONS = false;

var STATE = {
  stopped: 1,
  running: 2,
  starting: 3,
  stopping: 4
};

function resolvePem(path) {
  /* if the config value looks like {{RESOURCE:filename}} then
  see if the resource loader can find it */
  var match = path.match(/{{(RESOURCE:)(.*)}}/);
  if (match && match.length === 3) {
    var found = resource.resolve('conf', match[2]);
    if (found) {
      return found;
    }
  }

  return path;
}

function HttpServer(options) {
  options = options || { };
  if (!options.directory) {
    throw new Error("HttpServer created without a root directory specified");
  }

  if (!options.configKey || !config.get(options.configKey)) {
    throw new Error("invalid configKey specified when creating HttpServer");
  }

  this.directory = options.directory;
  this.configKey = options.configKey;
  this.debug = options.debug;
  this.config = config.get(options.configKey);
  this.connections = [];

  var self = this;

  /* update our internal config if the password changes; we do this
  because the auth handler (registered below) uses this value for
  web client login */
  config.on("changed", function(key, value) {
    if (key.indexOf(options.configKey) === 0) {
      log.info(TAG, "updating config for key", self.configKey);
      self.config = config.get(self.configKey);
    }
  });

  this.state = STATE.stopped;
}

_.extend(HttpServer.prototype, {
  start: function() {
    var d = Q.defer();

    var errorHandler = function(err) {
      this.state = STATE.stopped;
      d.reject({message: "failed to start server", error: err});
    }.bind(this);

    switch (this.state) {
      case STATE.running:
        d.resolve();
        break;

      case STATE.stopping:
      case STATE.starting:
        d.reject({message: "cannot start, invalid state", state: this.state});
        break;

      case STATE.stopped:
        this.state = STATE.starting;
        this.recreate();

        this.httpServer.once('error', errorHandler);

        this.httpServer.listen(this.config.port, function() {
          this.httpServer.removeListener('error', errorHandler);
          this.state = STATE.running;
          d.resolve();
        }.bind(this));

        break;
    }

    return d.promise;
  },

  stop: function() {
    var d = Q.defer();

    switch (this.state) {
      case STATE.running:
        this.state = STATE.stopping;

        var onClosed = _.once(function() {
          this.clientProxy.disconnect();
          this.clientProxy = null;
          this.sessions.close();
          this.sessions = null;
          this.express = null;
          this.httpServer = null;
          this.state = STATE.stopped;
          d.resolve();
        }).bind(this);

        for (var i = 0; i < this.connections.length; i++) {
          this.connections[i].destroy();
        }

        this.connections = [];
        this.httpServer.close(onClosed);

        setTimeout(function() {
          log.warn(TAG, "httpServer.close() callback timeout; automated reset now");
          onClosed();
        }, 5000);
        break;

      case STATE.stopping:
      case STATE.starting:
        d.reject({
          message: "cannot stop, already in state " + this.state,
          directory: this.directory
        });
        break;

      case STATE.stopped:
        d.resolve();
        break;
    }

    return d.promise;
  },

  recreate: function() {
    log.info(TAG, "recreate()ing...");

    this.express = express();

    this.authCookieName = 'connect.sid-' + this.config.port;

    /* connection validator */
    this.express.use(function(req, res, next) {
      if (!blacklist.allowConnection(req)) {
        res.writeHead(401);
        res.end(BLACKLISTED_PAGE);
      }
      else {
        next();
      }
    });

    /* standard middleware */
    this.express.use(cookieParser(COOKIE_SECRET));
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(bodyParser.json());
    this.express.use(compression());

    /* maps browser sessions to socket connections. doing this allows us
    to correlate browser sessions with web sockets. note: this must come
    *after* initializing the express.cookieParser with the same secret key */
    this.sessionStore = new session.MemoryStore();

    this.express.use(session({
      store: this.sessionStore,
      secret: COOKIE_SECRET,
      resave: true,
      saveUninitialized: true,
      key: this.authCookieName
    }));

    /* request handlers. these need to come after the session middleware,
    so that has a chance to inject the "session" instance before we look
    at the requests */
    require('./Auth.js').addRequestHandler(this);
    require('./AppCache.js').addRequestHandler(this);

    var target = this.debug ? "/dist/debug/" : "/dist/release/";
    this.express.use(express.static(this.directory + target));

    /* create the http server instance, but don't start it yet. */
    this.httpServer = https.createServer({
      key: fs.readFileSync(resolvePem(this.config.key)),
      cert: fs.readFileSync(resolvePem(this.config.cert))
    }, this.express);

    /* sessions is a class that brokers communication between the
    browser clients and the http server; that is, this is the thing
    that receives raw messages from the browser */
    this.sessions = Sessions.create({
      httpServer: this.httpServer,
      sessionStore: this.sessionStore,
      authCookieName: this.authCookieName
    });

    /* the ClientProxy receives raw messages from the low-level autom8
    server */
    this.clientProxy = ClientProxy.create({
      configKey: this.configKey + ".proxy"
    });

    var self = this;

    /* when a message is received from the low-level server, relay it
    to the web clients so they can redraw */
    this.clientProxy.on('recvMessage', function(message) {
      self.sessions.broadcast('recvMessage', message);
    });

    /* when a message is received from a web client, relay it to the
    low-level server to query/set device status */
    this.sessions.onMessage('sendMessage', function(message, socket) {
      /* TODO FIXME: weird special case when receiving messages from
      admin server. ideally this logic would exist externally, somehow */
      if (message.uri.indexOf("autom8://request/libautom8/rpc") !== -1) {
        return;
      }

      self.clientProxy.send(message.uri, message.body);
    });

    /* when the http server finishes booting, connect to the client proxy */
    this.httpServer.on('listening', function() {
      self.clientProxy.connect();
    });

    /* when the server is shut down, close the client proxy */
    this.httpServer.on('close', function() {
      self.clientProxy.disconnect();
    });

    /* annoyingly, we need to keep track of open connections ourselves, and
    shut these down manually when the server is stopped */
    this.httpServer.on('secureConnection', function(socket) {
      self.connections.push(socket);

      if (DEBUG_CONNECTIONS) {
        log.info(
          TAG,
          self.configKey,
          "new connection".green,
          "connection count:",
          self.connections.length);
      }

      /* TODO FIXME: after *DAYS* of futzing around, it appears that web sockets
      remove the "close" listener before they hang up, leading to sockets that
      are never removed from our array. to fix this, we patch the socket's emit
      method and intercept "close" before it's processed */
      var originalEmit = socket.emit;

      socket.emit = function() {
        if (arguments[0] === "close") {
          self.connections = _.without(self.connections, socket);

          if (DEBUG_CONNECTIONS) {
            log.info(
              TAG,
              self.configKey,
              "socket closed".red,
              "connection count:",
              self.connections.length);
          }
        }

        originalEmit.apply(socket, arguments);
        /* TODO FIXME: end */
      };
    });
  }
});

exports.create = function(options) {
  return new HttpServer(options);
};