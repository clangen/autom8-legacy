var TAG = "[web socket sessions]".yellow;

var _ = require('lodash')._;
var io = require('socket.io');
var util = require('./Util.js');
var log = require('./Logger.js');

var SOCKET_DEBUG = false;

function Sessions(options) {
  if (!options.httpServer || !options.sessionStore || !options.authCookieName) {
    throw new Error("missing httpServer or sessionStore from input args");
  }

  this.handlers = []; /* callbacks that are triggered when messages are received */
  this.authCookieName = options.authCookieName;
  this.webSocketServer = this.createSocketServer(options.httpServer, options.sessionStore);
}

require('util').inherits(Sessions, require('events').EventEmitter);

_.extend(Sessions.prototype, {
  close: function() {
    this.connections.each(function(socket) {
      socket.destroy();
    });

    this.connections = { };
    this.handlers = [];
    this.sessionStore = null;
    this.webSocketServer = null;
    this.closed = true;
  },

  createSocketServer: function(httpServer, sessionStore) {
    this.sessionStore = sessionStore;

    this.connections = { };

    this.connections.each = function(callback) {
      for (var key in this) {
        if (this.hasOwnProperty(key) && key !== 'each') {
          callback(key, this[key]);
        }
      }
    };

    var socketServer = io(httpServer);

    /* disable verbose logging in non-debug mode */
    if (!SOCKET_DEBUG) {
      socketServer.set('log level', 1);
    }

    /* make sure the web socket being established has a related
    browser session. if not, don't allow the web socket connection
    to be made. */
    socketServer.use(function(socket, accept) {
      /* session id will be in the header cookies */
      var cookieString = socket.request.headers.cookie || "";
      var cookies = util.parseCookie(cookieString);
      var sessionId = cookies[this.authCookieName];

      /* no session id at all is an instant rejection */
      if (!sessionId) {
        log.warn(TAG, "socket connection with no session, rejecting.");
        return accept("unauthorized", false);
      }

      /* raw session identifiers seem to always be in the following format:
      s:[sessionId].[someData]. Not quite sure why -- code samples I see on
      the net suggest this is not the case. At any rate, here we grab the
      actual sessionId if it exists. */
      var match = sessionId.match(/s\:(.*)\..*/);
      if (match && match.length === 2) {
        sessionId = match[1];
      }

      /* now make sure the session specified in the request actually exists */
      this.sessionStore.get(sessionId, function(err, s) {
        if (err || !s) {
          log.warn(TAG, "socket connection with invalid session, rejecting.");
          return accept("unauthorized", false);
        }

        if (!s.cookie) {
          log.warn(TAG, "socket connection with no cookie, rejecting.");
          return accept("unauthorized", false);
        }

        if (!s.cookie.expires) {
          /* invalid expiry date in session */
          log.warn(TAG, "socket connection with no expiry, rejecting.");
          return accept("unauthorized", false);
        }

        var expires = new Date(s.cookie.expires);
        var now = new Date();
        if (expires - now <= 0) {
          /* cookie expired, reject... */
          log.warn(TAG, "socket connection with expired session, rejecting.");
          return accept("unauthorized", false);
        }

        /* if we get all the way here then our session is trusted */
        log.info(TAG, "socket connection with valid session, accepting.");
        return accept(null, true);
      });
    }.bind(this));

    socketServer.on('connection', function (socket) {
      var addr = socket.handshake.address;
      log.info(TAG, "client connected (" + addr.address + ":" + addr.port + ")");

      this.connections[socket.id] = socket;
      this.emit('connection', socket);

      socket.on('disconnect', function() {
        delete this.connections[socket.id];
      }.bind(this));

      /* makes sure the socket that generated the message is
      the second param of callback */
      var wrap = function(fn, socket) {
        return function() {
          fn.call(fn, arguments[0], socket);
        };
      };

      for (var i = 0; i < this.handlers.length; i++) {
        socket.on(
          this.handlers[i].message,
          wrap(this.handlers[i].handler, socket)
        );
      }
    }.bind(this));

    return socketServer;
  },

  broadcast: function(message, contents, options) {
    options = options || { };

    if (!this.webSocketServer) {
      log.warn(TAG, "message broadcast before Sessions have been initialized");
    }
    else {
      if (!options.exclude) {
        this.webSocketServer.emit(message, contents);
      }
      else {
        this.connections.each(function(key, value) {
          if (value && value.id && value.id !== options.exclude && value.emit) {
            value.emit(message, contents);
          }
        });
      }
    }
  },

  onMessage: function(message, handler) {
    this.handlers.push({message: message, handler: handler});
  }
});

exports = module.exports = {
  create: function(options) {
    return new Sessions(options);
  }
};