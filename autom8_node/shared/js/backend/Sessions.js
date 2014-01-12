(function() {
  var io = require('socket.io');
  var util = require('./Util.js');
  var config = require('./Config.js').get();

  /* callbacks that are triggered when messages are received */
  var handlers = [];

  /* set via init() */
  var httpServer = null;

  /* these are the web socket connections */
  var webSocketServer = null;

  function createSocketServer(httpServer, sessionStore) {
    var socketServer = io.listen(httpServer);

    /* disable verbose logging in non-debug mode */
    if (!config.debug) {
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
        console.log("WARNING: socket connection with no session, rejecting.");
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
          console.log("WARNING: socket connection with invalid session, rejecting.");
          return accept("unauthorized", false);
        }

        if (!s.cookie) {
          console.log("WARNING: socket connection with no cookie, rejecting.");
          return accept("unauthorized", false);
        }

        if (!s.cookie.expires) {
          /* invalid expiry date in session */
          console.log("WARNING: socket connection with no expiry, rejecting.");
          return accept("unauthorized", false);
        }

        var expires = new Date(s.cookie.expires);
        var now = new Date();
        if (expires - now <= 0) {
          /* cookie expired, reject... */
          console.log("WARNING: socket connection with expired session, rejecting.");
          return accept("unauthorized", false);
        }

        /* if we get all the way here then our session is trusted */
        console.log("INFO: socket connection with valid session, accepting.");
        return accept(null, true);
      });
    });

    socketServer.sockets.on('connection', function (socket) {
      var addr = socket.handshake.address;
      console.log("client connected (" + addr.address + ":" + addr.port + ")");

      for (var i = 0; i < handlers.length; i++) {
        socket.on(handlers[i].message, handlers[i].handler);
      }
    });

    return socketServer;
  }

  exports = module.exports = {
    init: function(app) {
      if (webSocketServer) {
        console.log("already initialized! aborting");
        throw new Error('aborting');
      }

      webSocketServer = createSocketServer(app.httpServer, app.sessionStore);
    },

    broadcast: function(message, options) {
      webSocketServer.sockets.emit(message, options);
    },

    on: function(message, handler) {
      handlers.push({message: message, handler: handler});
    }
  };
}());