// npm install commander connect express socket.io socket.io-client less uglify
// node.exe Server.js --listen 7902 --creds autom8.pem --clienthost ricochet.ath.cx --clientport 7901 --debug

var express = require('express');
var tls = require('tls');
var fs = require('fs');
var io = require('socket.io');
var url = require('url');
var crypto = require('crypto');
var program = require('commander');
var less = require('less');

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
        return cache[fn];
      },

      put: function (fn, data) {
        cache[fn] = data;
      }
    };
  }());

  /* modified from http://stackoverflow.com/questions/3393854/
  get-and-set-a-single-cookie-with-node-js-http-server */
  function parseCookie(str) {
    var cookies = { }; /* result */
    str = str || "";

    var rawCookies = str.split(';');
    for (var i = 0; i < rawCookies.length; i++) {
      var parts = rawCookies[i].split('=');
      if (parts.length === 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim()) || "";
      }
    }
    return cookies;
  }

  function renderTemplates(doc) {
    var result = "";
    var path = __dirname + '/templates/';
    var files = fs.readdirSync(path) || [];
    for (var i = 0; i < files.length; i++) {
      if (files[i].match(/.*\.html$/)) {
        result += fs.readFileSync(path + files[i], "utf8");
        result += "\n\n";
      }
    }
    
    return doc.replace("{{templates}}", result);
  }

  function renderScripts(doc, types) {
    types = types || ['scripts', 'styles'];
    
    if (typeof types === 'string') {
      types = [types];
    }

    var typesRegex = new RegExp(".*\\.(" + types.join("|") + ")$");

    var path = __dirname + '/templates/';
    var files = fs.readdirSync(path) || [];
    var contents;
    
    for (var i = 0; i < files.length; i++) {
      if (files[i].match(typesRegex)) {
        contents = fs.readFileSync(path + files[i]).toString() + "\n\n";
        doc = doc.replace("{{" + files[i] + "}}", contents);
      }
    }

    return doc;
  }

  function renderNonMinifiedScripts(doc) {
    /* our main document has a {{minified_scripts}} placeholder that we
    remove here when we render in non-minified mode */
    doc = doc.replace("{{minified_scripts}}", "");
    return renderScripts(doc);
  }

  function renderMinifiedScripts(doc) {
    /* separate the rendered scripts into an array of lines. we'll use
    this to build a list of all the .js files that we will minify */
    var lines = renderScripts(doc).split(/\r\n|\n/);

    /* these are special scripts that we can't safely/easily minify. they
    will be excluded from the minification process and added to the
    document above the minified scripts */
    var blacklist = {
      '/socket.io/socket.io.js': true
    };

    var scriptFilenames = []; /* all files in this array will be minified */
    var scriptRegex = /.*src="(.*\.js)"/;
    var match;

    /* run through each line, seeing if it's a <script> file. if it is,
    add it to the scriptFilenames[] array. */
    for (var i = 0; i < lines.length; i++) {
      match = lines[i].match(scriptRegex);
      if (match && match.length === 2) {
        if (!blacklist[match[1]]) {
          scriptFilenames.push(match[1]);
        }
      }
    }

    var minified = "";

    /* render all the blacklisted <script> tags */
    for (var k in blacklist) {
      if (blacklist.hasOwnProperty(k)) {
        minified += '<script src="' + k + '" type="text/javascript"></script>\n';
      }
    }

    /* render the minified javascript to the document */
    minified +=
      '<script type="text/javascript">' +
      require('uglify-js').minify(scriptFilenames).code +
      '</script>';

    doc = renderScripts(doc, ["styles"]);
    doc = doc.replace("{{minified_scripts}}", minified);

    /* remove any {{*.script}} identifiers, they have all been minified */
    doc = doc.replace(/\{\{.*\.scripts\}\}/g, "");

    return doc;
  }

  function start() {
    /* the one and only application */
    var app = express();

    /* sigh, what should this be? */
    var secret = "autom84Lyfe";

    /* maps browser sessions to socket connections. doing this allows us
    to correlate browser sessions with web sockets */
    var sessionStore = new express.session.MemoryStore();
    
    /* magic middleware */
    app.use(express.cookieParser(secret));

    app.use(express.bodyParser());
    
    app.use(express.session({
      store: sessionStore,
      secret: secret,
      key: 'connect.sid'
    }));

    /* sign in handler */
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

    /* sign out handler */
    app.post('/signout.action', function(req, res) {
      req.session.authenticated = false;
      req.session.cookie.maxAge = 0;
      res.writeHead(200);
      res.end("");
    });

    app.get('/signedin.action', function(req, res) {
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

      var debug = false;
      if (fn === "debug.html") {
        debug = autom8.config.debug && true;
        fn = "index.html";
      }

      /* empty root (or those trying to game relative paths)
      receive index.html */
      if (fn === "" || fn.indexOf("..") > -1) {
        fn = "index.html";
      }

      /* determine the MIME type we'll write in the response */
      var mimeType = autom8.util.getMimeType(fn);

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
      var cachedFile;
      if (!debug) {
        cachedFile = fileCache.get(fn);
      }

      if (cachedFile) {
        console.log("cache hit: " + fn);
        writeResponse(cachedFile);
      }
      else {
        console.log("cache miss: " + fn);

        /* file not cached yet, read it from disk */
        fs.readFile(
        fn,
        function (err, data) {
          /* read failed */
          if (err || !data) {
            res.writeHead(500);
            return res.end('error loading: ' + fn);
          }

          if (fn.match(/.*\.css$/)) {
            var parser = new less.Parser();

            parser.parse(data.toString(), function (err, tree) {
                if (!err) {
                  console.log("LESS: successfully processed " + fn);
                  data = tree.toCSS();

                  if (!autom8.config.debug) {
                    fileCache.put(fn, data);
                  }

                  writeResponse(data);
                }
                else {
                  console.log("LESS: CSS parse failed because " + require('util').inspect(err));
                }
            });
          }
          else {
            if (fn.match(/.*\.html$/)) {
              data = data.toString();
              data = renderTemplates(data);
              data = debug ? renderNonMinifiedScripts(data) : renderMinifiedScripts(data);
            }

            if (!debug) {
              fileCache.put(fn, data);
            }

            writeResponse(data);
          }
        });
      }
    });

    /* start the http server */
    var serverOptions = {
      key: fs.readFileSync(autom8.config.server.pem),
      cert: fs.readFileSync(autom8.config.server.pem)
    };

    var httpServer = require('https').createServer(serverOptions, app);
    httpServer.listen(autom8.config.server.port);

    /* these are the web socket connections */
    autom8.sessions = (function() {
      var webSocketServer = io.listen(httpServer);

      /*
       * disable verbose socket.io logging in non-debug runs.
       */
      if (!program['debug']) {
        webSocketServer.set('log level', 1);
      }

      /* make sure the web socket being established has a related
      browser session. if not, don't allow the web socket connection
      to be made. */
      webSocketServer.set('authorization', function (data, accept) {
        /* session id will be in the header cookies */
        var cookieString = data.headers.cookie || "";
        var cookies = parseCookie(cookieString);
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

          console.log(s.cookie);

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
            return accept(null, true);
          }

          /* if we get all the way here then our session is trusted */
          console.log("INFO: socket connection with valid session, accepting.");
          return accept(null, true);
        });
      });

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
  var connecting = false;

  /* ping server every 20 seconds when connected */
  (function sendPing() {
    if (connected) {
      autom8.client.send(autom8.requests.ping, { });
    }

    setTimeout(sendPing, 20000);
  }());

  function reconnect() {
    if (connecting) {
      console.log("reconnect() called but already connecting.");
      return;
    }

    console.log("attempting to reconnect...");
    disconnect();

    setTimeout(function() {
      if (!connected) {
        autom8.client.connect();
      }
    }, 5000);
  }

  function connect() {
    if (connected) {
      console.log('connect() called, but already connected. bailing...');
      return;
    }

    var cfg = autom8.config.client;

    socketStream = tls.connect(cfg.port, cfg.host, function() {
      if (socketStream !== this) {
        /* some other reconnect attempt won */
        disconnect(this);
      }
      else {
        /* successful connection, authenticate */
        console.log('connected to autom8 server');
        connecting = false;
        connected = true;

        autom8.client.send(
          autom8.requests.authenticate, {
            password: cfg.password
          }
        );
      }
    });

    socketStream.on('error', reconnect);
    socketStream.on('end', reconnect);
    socketStream.on('data', dispatchReceivedMessage);
  }

  function disconnect(stream) {
    console.log('disconnecting...');

    stream = stream || socketStream;

    if (stream) {
      stream.removeAllListeners('error');
      stream.removeAllListeners('end');
      stream.removeAllListeners('data');

      try {
        stream.destroy();
      }
      catch (e) {
        console.log('socket.destroy() threw');
      }
    }

    lastBuffer = null;
    connected = connecting = false;
    if (stream === socketStream) {
      socketStream = null;
    }

    console.log('disconnected.');
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
          console.log("ERROR: message parsed failed, reconnecting...");
          lastBuffer = null;
          reconnect();
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
if (!program['clientpw']) {
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