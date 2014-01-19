(function() {
  var TAG = "[sessions]".yellow;

  var io = require('socket.io');
  var util = require('./Util.js');
  var config = require('./Config.js').get();
  var log = require('./Logger.js');

  /* callbacks that are triggered when messages are received */
  var handlers = [];

  /* set via init() */
  var httpServer = null;

  /* these are the web socket connections */
  var webSocketServer = null;

  function createSocketServer(httpServer, sessionStore) {
    var socketServer = io.listen(httpServer);

    /* disable verbose logging in non-debug mode */
    if (!config.socketDebug) {
      socketServer.set('log level', 1);
    }

    /* make sure the web socket being established has a related
    browser session. if not, don't allow the web socket connection
    to be made. */
    socketServer.set('authorization', function (data, accept) {
      /* session id will be in the header cookies */
      var cookieString = data.headers.cookie || "";
      var cookies = util.parseCookie(cookieString);
      var sessionId = cookies['connect.sid'];

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
      sessionStore.get(sessionId, function(err, s) {
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
    });

    socketServer.sockets.on('connection', function (socket) {
      var addr = socket.handshake.address;
      log.info(TAG, "client connected (" + addr.address + ":" + addr.port + ")");

      EXPORTS.events.emit('connection', socket);

      /* makes sure the socket that generated the message is
      the second param of callback */
      var wrap = function(fn, socket) {
        return function() {
          fn.call(fn, arguments[0], socket);
        };
      };

      for (var i = 0; i < handlers.length; i++) {
        socket.on(
          handlers[i].message,
          wrap(handlers[i].handler, socket)
        );
      }
    });

    return socketServer;
  }

  var EXPORTS = { };
  exports = module.exports = EXPORTS;
  EXPORTS.events = Object.create(require('events').EventEmitter.prototype);

  EXPORTS.init = function(app) {
    if (webSocketServer) {
      log.error(TAG, "already initialized! aborting");
      throw new Error('aborting');
    }

    webSocketServer = createSocketServer(app.httpServer, app.sessionStore);
  };

  EXPORTS.broadcast = function(message, options) {
    webSocketServer.sockets.emit(message, options);
  };

  EXPORTS.on = function(message, handler) {
    handlers.push({message: message, handler: handler});
  };
}());