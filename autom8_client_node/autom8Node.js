// npm install commander express socket.io socket.io-client
// node.exe autom8/autom8Node.js --listen 7902 --creds ./autom8/autom8.pem --clienthost ricochet.ath.cx --clientport 7901 --debug

var express = require('express');
var tls = require('tls');
var fs = require('fs');
var io = require('socket.io');
var url = require('url');
var crypto = require('crypto');
var program = require('commander');

/*
 * autom8 namespace
 */
var autom8 = { };

/*
 * Just for reference, these are the important players...
 */
autom8.server = null;
autom8.client = null;
autom8.sessions = null;
autom8.config = null;

/*
 * Request and response messages
 */
autom8.requests = {
  authenticate: "autom8://request/authenticate",
  get_device_list: "autom8://request/get_device_list",
  ping: "autom8://request/ping"
};

autom8.responses = {
  authenticated: "autom8://response/authenticated",
  authenticate_failed: "autom8://response/authenticate_failed",
  pong: "autom8://response/pong"
};

/*
 * Application's pseudo-entry point
 */
autom8.main = function() {
  autom8.config = {
    debug: program['debug'],
    sessionTimeout: 1800000, /* half hour, millis */
    server: {
      port: program['listen'],
      pem: program['creds']
    },
    client: {
      host: program['clienthost'],
      port: program['clientport'],
      password: program['clientpw']
    }
  };

  autom8.server.start();
  autom8.client.connect();
};

/*
 * Object which encapsulates all of the https server logic. Exposes
 * a single "start()" method that should be called befoore starting
 * the client.
 */
autom8.server = (function() {
  /*
   * Encapsulated file cache for the server. This will be used to
   * cache file contents so we don't have to go do disk every time
   * a request is made.
   *
   * Disabled in debug mode.
   */
  var fileCache = (function() {
    var cache = { };

    return {
      get: function (fn) {
        return ( ! autom8.config.debug) && cache[fn];
      },

      put: function (fn, data) {
        if (!autom8.config.debug) {
          cache[fn] = data;
        }
      }
    };
  }());
    
  function start() {
    /*
     * The actual HTTP server instance lives here.
     */
    var app = express();

    var serverOptions = {
      key: fs.readFileSync(autom8.config.server.pem),
      cert: fs.readFileSync(autom8.config.server.pem)
    };

    var httpServer = require('https').createServer(serverOptions, app);

    app.use(express.cookieParser("autom84Lyfe"));
    app.use(express.bodyParser());
    app.use(express.session());

    /*
     * Handler for the signin POST action.
     */
    app.post('/signin.action', function(req, res) {
      if (req.body.password === autom8.config.client.password) {
        req.session.authenticated = true;
        req.session.cookie.maxAge = autom8.config.sessionTimeout;
        res.writeHead(200);
      }
      else {
        res.writeHead(401);
      }

      res.end("");
    });

    /*
     * Handler for the signin POST action.
     */
    app.post('/signout.action', function(req, res) {
      req.session.authenticated = false;
      req.session.cookie.maxAge = 0;
      res.writeHead(200);
      res.end("");
    });

    /*
     * General request handler; looks at the request, figures out
     * which file to return. Deals with caching and unathenticated
     * clients.
     */
    app.get(/.*/, function(req, res) {
      var fn = url.parse(req.url).pathname;

      /* check-remove leading slash */
      if (fn.length > 0 && fn.charAt(0) == '/') {
        fn = fn.substr(1);
      }

      /* empty root (or those trying to game relative paths)
         receive index.html */
      if (fn === "" || fn.indexOf("..") > -1) {
        fn = "index.html";
      }

      /* determine the MIME type we'll write in the response */
      var mimeType = autom8.util.getMimeType(fn);

      if ((!req.session.authenticated) && (mimeType == "text/html")) {
        fn = "signin.html";
      }

      fn = __dirname + '/' + fn;

      /* method to write the response once we have the file data
      for this particular request */
      function writeResponse(data) {
        res.writeHead(200, {
          'Content-Type': mimeType
        });

        res.end(data);
      }

      /* check to see if the file is cached. if it is, return it now */
      var cachedFile = fileCache.get(fn);
      if (cachedFile) {
        if (autom8.config.debug) { console.log("cache hit for " + fn); }
        writeResponse(cachedFile);
      }
      else {
        /* file not cached yet, read it from disk */
        fs.readFile(
        fn,
        function (err, data) {
          /* read failed */
          if (err || !data) {
            res.writeHead(500);
            return res.end('error loading: ' + fn);
          }

          fileCache.put(fn, data);
          writeResponse(data);
        });
      }
    });

    /*
     * start the http server now!
     */
    httpServer.listen(autom8.config.server.port);

    /*
     * these are the web socket connections
     */
    autom8.sessions = (function() {
      var webSocketServer = io.listen(httpServer);

      /*
       * disable verbose socket.io logging in non-debug runs.
       */
      if (!program['debug']) {
        webSocketServer.set('log level', 1);
      }

      webSocketServer.sockets.on('connection', function (socket) {
        var addr = socket.handshake.address;
        console.log("client connected (" + addr.address + ":" + addr.port + ")");

        socket.on('sendMessage', function(message) {
          autom8.client.send(message.uri, message.body);
        });
      });

      /*
       * sessions public api
       */
      return {
        broadcast: function(message) {
          webSocketServer.sockets.emit('recvMessage', message);
        }
      };
    }());
  }

  return {
    "start": start
  };
}());

/*
 * The autom8 client! This thing connects to the remote autom8 server
 * and does physical sending and receiving of autom8:// messages. The
 * exposed "connect" method should be called *after* the https server
 * has been started (i.e. after autom8.server.start() has been called).
 */
autom8.client = (function() {
  var socketStream = null;
  var lastBuffer = null;
  var connected = false;
  var pingTimeout = null;

  function connect() {
    if (connected) {
      disconnect();
    }

    var reconnect = function() {
      console.log("attempting to reconnect...");

      setTimeout(function() {
        if ( ! connected) {
          autom8.client.connect();
        }
      }, 5000);
    };

    var connectionSevered = function() {
      autom8.client.disconnect();
      reconnect();
    };
  
    var cfg = autom8.config.client;

    socketStream = tls.connect(cfg.port, cfg.host, function() {
      console.log('connected to autom8 server');
      connected = true;

      socketStream.on('data', dispatchReceivedMessage);
      socketStream.on('end', connectionSevered);

      autom8.client.send(
        autom8.requests.authenticate, {
          password: cfg.password
        }
      );

      function sendPing() {
        if (connected) {
          autom8.client.send(autom8.requests.ping, { });
        }

        setTimeout(sendPing, 20000);
      }

      if (!pingTimeout) {
        sendPing();
        pingTimeout = true;
      }
    });

    socketStream.on('error', reconnect);
  }

  function disconnect() {
    if (socketStream) {
      try {
        socketStream.destroy();
      }
      catch (e) {
        console.log('socket.destroy() threw');
      }
    }

    connected = false;
    socketStream = null;
    console.log('disconnected');
  }

  function send(uri, body) {
    if (!socketStream) {
      return;
    }

    body = (body || {});

    if (typeof(body) === 'object') {
      body = JSON.stringify(body);
    }

    var plainText = uri + "\r\n" + body;
    var b64 = new Buffer(plainText).toString('base64') + "\0";
    socketStream.write(b64);
  }

  function dispatchReceivedMessage(data) {
    var message = parseMessage(data);

    if (message) {
      /*
       * The only message we special case is the failed authentication
       * response, because it's a critical error. Everything other type
       * of error is retried until the the user exists the process.
       */
      if (message.uri === autom8.responses.authenticate_failed) {
        console.log("connection failed: password rejected.");
        process.exit(-99);
      }
      /*
       * If we just connected, send a get_device_list, this is a cheap way
       * to cause all connected webclients to "refresh"
       */
      else if (message.uri === autom8.responses.authenticated) {
        send(autom8.requests.get_device_list);
      }

      autom8.sessions.broadcast(message);
    }
  }

  function parseMessage(data) {
    /* if there was a left-over buffer, construct a new buffer and
       concat it with the new one */
    if (lastBuffer) {
      var newData = new Buffer(lastBuffer.length + data.length);
      lastBuffer.copy(newData, 0, lastBuffer);
      data.copy(newData, lastBuffer.length, data);
      data = newData;
      lastBuffer = null;
    }

    /* find the null terminator in the buffer, this is EOM */
    var terminator;
    for (var i = 0; i < data.length; i++) {
      if (data[i] === 0) {
        terminator = i;
        break;
      }
    }

    /* split the buffer, if necessary */
    if (terminator) {
      if (terminator < (data.length - 1)) {
        console.log("input message will be sliced at " + terminator);
        lastBuffer = data.slice(terminator);
      }

      /* convert base64 message to plaintext */
      var plainText = new Buffer(data.toString(), 'base64').toString('utf8');
      var parts = plainText.split("\r\n");

      /* parse the payload */
      if (parts.length === 2) {
        var message = null;

        try {
          message = {
            uri: parts[0],
            body: JSON.parse(parts[1])
          };
        }
        catch (parseError) {
          console.log("ERROR: message parsed failed, disconnecting...");
          lastBuffer = null;
          disconnect();
        }

        if (autom8.config.debug) {
          console.log("server said: " + JSON.stringify(message));
        }

        return message;
      }
    }

    console.log("unable to parse message");
    return null;
  }

  /*
   * autom8.client public API
   */
  return {
    "connect": connect,
    "disconnect": disconnect,
    "send": send
  };
}());

/*
 * A collection of utility methods.
 */
autom8.util = {
  /*
   * Returns an SHA1 hash of the specified data.
   */
  sha1: function(data) {
    var checksum = crypto.createHash('sha1');
    checksum.update(data);
    return checksum.digest('hex');
  },

  /*
   * Returns the proper MIME type based on the specified path's extension.
   */
  getMimeType: (function() {
    var fallback = "text/plain";

    var types = {
      ".htm": "text/html",
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".ico": "image/x-icon"
    };

    return function(fn) {
        var last = fn.lastIndexOf(".");
        var extension = (last && -1) &&  fn.substr(last).toLowerCase();
        return (types[extension] || fallback);
    };
  }())
};

/*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~
/* GLOBAL STARTUP:
 *
 * Parse out command-line options
 */
program
  .version("0.3.0")
  .usage('params:')
  .option('--listen <port>', 'port we will listen on')
  .option('--creds <pem>', 'pem file containing both cert and private key')
  .option('--clienthost <hostname>', 'autom8 server to connect to')
  .option('--clientport <port>', 'port the autom8 server is listening on')
  .option('--clientpw <password hash>', 'password for the autom8 server')
  .option('--debug', 'enable verbose debug output', Boolean, false)
  .parse(process.argv);

/*
 * If a password hash wasn't supplied via command-line, read one
 * from stdin now, hash it, and cache it.
 */
if ( ! program['clientpw']) {
  var host = program['clienthost'];
  program.password('Password for ' + host + ': ', '*', function(pass){
    program['clientpw'] = autom8.util.sha1(pass);
    autom8.main();
  });
}
/*
 * Start everything up!
 */
else {
  autom8.main();
}
/*
/*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*~*/