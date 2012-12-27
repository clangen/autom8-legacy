// npm install commander connect express socket.io socket.io-client less uglify clean-css
// node.exe server/Server.js --listen 7902 --creds server/autom8.pem --clienthost ricochet.ath.cx --clientport 7901 --debug


/*
 * Object which encapsulates all of the https server logic. Exposes
 * a single "start()" method that should be called befoore starting
 * the client.
 */
(function() {
  var express = require('express');
  var fs = require('fs');
  var io = require('socket.io');
  var url = require('url');
  var less = require('less');
  var zlib = require('zlib');

  var util = require('./Util.js');
  var sessions = require('./Sessions.js');
  var config = require('./Config.js').get();

  var root = process.cwd() + '/client';

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
      get: function (fn, encoding) {
        cache[encoding] = cache[encoding] || { };
        return cache[encoding][fn];
      },

      put: function (fn, encoding, data) {
        cache[encoding] = cache[encoding] || { };
        cache[encoding][fn] = data;
      },

      clear: function() {
        cache = { };
      }
    };
  }());

  function renderTemplates(doc) {
    var result = "";
    var path = root + '/templates/';
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

    var path = root + '/templates/';
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

  function renderNonMinifiedStyles(doc) {
    doc = doc.replace("{{minified_styles}}", "");
    return renderScripts(doc, 'styles');
  }

  function renderNonMinifiedScripts(doc) {
    /* our main document has a {{minified_scripts}} placeholder that we
    remove here when we render in non-minified mode */
    doc = doc.replace("{{minified_scripts}}", "");
    return renderScripts(doc, 'scripts');
  }

  function renderMinifiedStyles(doc) {
    /* separate the rendered scripts into an array of lines. we'll use
    this to build a list of all the .css files that we will minify */
    var lines = renderScripts(doc).split(/\r\n|\n/);

    /* runs LESS, then minifies result */
    var processCss = function(css) {
      var parser = new less.Parser();
      var result = "";

      parser.parse(css, function (err, tree) {
          if (!err) {
            result = tree.toCSS();
          }
          else {
            err = require('util').inspect(err);
            console.log("LESS: CSS parse failed because " + err);
          }
      });

      if (result) {
        result = require('clean-css').process(result);
      }

      return result;
    };

    /* run through each line, seeing if it's a css file. if it is,
    process it */
    var regex = /.*href="(.*\.css)"/;
    var match;
    var allCss = "";

    for (var i = 0; i < lines.length; i++) {
      match = lines[i].match(regex);
      if (match && match.length === 2) {
        allCss += fs.readFileSync(root + '/' + match[1]).toString();
      }
    }

    var minified = processCss(allCss);
    doc = doc.replace("{{minified_styles}}", "<style>" + minified + "</style>");
    doc = doc.replace(/\{\{.*\.styles\}\}/g, "");

    return doc;
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
          scriptFilenames.push(root + '/' + match[1]);
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

    // doc = renderScripts(doc, ["styles"]);
    doc = doc.replace("{{minified_scripts}}", minified);

    /* remove any {{*.script}} identifiers, they have all been minified */
    doc = doc.replace(/\{\{.*\.scripts\}\}/g, "");

    return doc;
  }

  function renderAppcacheManifest(res) {
    manifest = "CACHE MANIFEST\n";
    manifest += "# VERSION: " + config.appCache.version + "\n\n";

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
      if (req.body.password === config.client.password) {
        req.session.authenticated = true;
        req.session.cookie.maxAge = config.sessionTimeout;
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

    app.get(/autom8.appcache/, function(req, res) {
      console.log('rendering appcache (' + config.appCache.version + ')...');
      renderAppcacheManifest(res);
    });

    /*
     * General request handler; looks at the request, figures out
     * which file to return. Deals with caching, compression, and
     * unathenticated clients.
     */
    app.get(/.*/, function(req, res) {
      var fn = url.parse(req.url).pathname;

      /* check-remove leading slash */
      if (fn.length > 0 && fn.charAt(0) == '/') {
        fn = fn.substr(1);
      }

      /* if debug.html is being requested, or the referrer is debug.html,
      then set the debug flag to bypass both the fileCache and the
      minification process */
      var debug = false;
      if (fn === "debug.html") {
        if (config.debug) {
          fileCache.clear();
          debug = true;
        }

        fn = "index.html";
      }
      else if (/.*debug.html$/.test(req.headers.referer)) {
        debug = config.debug && true;
      }

      /* if we're hitting the debug endpoint then invalidate the
      appcache manifest */
      if (debug) {
        config.appCache.version = new Date().toString();
      }

      /* empty root (or those trying to game relative paths)
      receive index.html */
      if (fn === "" || fn.indexOf("..") > -1) {
        fn = "index.html";
      }

      var appcache = (config.appCache.enabled && !debug);
      if (!debug && !appcache && fn === "index.html") {
        var params = util.parseQuery(url.parse(req.url).query);
        appcache = (params.appcache === "1");
      }

      /* determine the MIME type we'll write in the response */
      var mimeType = util.getMimeType(fn);

      fn = root + '/' + fn;

      /* given the request, figure out what type of encoding to use when
      writing the result */
      var acceptEncoding = req.headers['accept-encoding'] || "";
      var responseEncoding = null; /* encoding we report in response headers */
      var writeEncode = 'binary'; /* encoding of compressed output */

      if (acceptEncoding.match(/\bdeflate\b/)) {
        responseEncoding = "deflate";
      }
      else if (acceptEncoding.match(/\bgzip\b/)) {
        responseEncoding = "gzip";
      }
      else {
        writeEncode = 'utf8';
      }

      /* writes the response for this request with the specified encoding */
      var writeResponse = function(fn, data, options) {
        options = options || { };

        /* default compression is a no-op */
        var compress = function(data, callback) {
          callback(null, data);
        };

        /* if we're writing from a cache hit, don't re-compress */
        if (!options.fromCache) {
          if (responseEncoding === "deflate") {
            compress = zlib.deflate;
          }
          else if (responseEncoding === "gzip") {
            compress = zlib.gzip;
          }
        }

        /* run the compression algorithm */
        compress(data, function(err, compressed) {
          /* it's important the compressed data is properly encoded. for deflate
          and gzip we need to writeEncode with 'binary', but 'utf8' for non-
          compressed responses */
          data = compressed.toString(writeEncode);

          if (!debug) {
            fileCache.put(fn, responseEncoding, data);
          }

          /* figure out response headers */
          var responseHeaders = {
            'content-type': mimeType
          };

          if (responseEncoding) {
            responseHeaders['content-encoding'] = responseEncoding;
          }

          /* write it back to the requester */
          res.writeHead(200, responseHeaders);
          res.write(data, writeEncode);
          res.end();
        });
      };

      /* check to see if the file is cached. if it is, return it now */
      var cachedFile;
      if (!debug) {
        cachedFile = fileCache.get(fn, responseEncoding);
      }

      if (cachedFile) {
        console.log("cache hit: " + fn);
        writeResponse(fn, cachedFile, {fromCache: true});
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
                  writeResponse(fn, data);
                }
                else {
                  console.log("LESS: CSS parse failed because " + require('util').inspect(err));
                }
            });
          }
          else {
            if (fn.match(/.*\.html$/)) {
              data = data.toString();
              data = data.replace("{{manifest}}", appcache ? 'autom8.appcache' : '');
              data = renderTemplates(data);
              data = debug ? renderNonMinifiedStyles(data): renderMinifiedStyles(data);
              data = debug ? renderNonMinifiedScripts(data) : renderMinifiedScripts(data);
            }

            writeResponse(fn, data);
          }
        });
      }
    });

    /* start the http server */
    var serverOptions = {
      key: fs.readFileSync(config.server.pem),
      cert: fs.readFileSync(config.server.pem)
    };

    var httpServer = require('https').createServer(serverOptions, app);
    httpServer.listen(config.server.port);
    sessions.init(httpServer, sessionStore);
  }

  exports.start = start;
}());
