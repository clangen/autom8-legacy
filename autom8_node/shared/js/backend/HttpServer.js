/*
 * Object which encapsulates all of the https server logic. Exposes
 * a single "create()" method that should be called befoore starting
 * the client.
 */
(function() {
  var express = require('express');
  var fs = require('fs');
  var url = require('url');
  var zlib = require('zlib');
  var path = require('path');

  var util = require('./Util.js');
  var config = require('./Config.js').get();
  var blacklist = require('./Blacklist.js');
  var minifier = require('./Minifier.js');
  var fileCache = require('./FileCache.js');

  var root = process.cwd() + '/frontend';

  var STATIC_PAGES = {
    'compiling': fs.readFileSync(__dirname + '/static/compiling.html').toString(),
    'blacklisted': fs.readFileSync(__dirname + '/static/blacklisted.html').toString()
  };

  function fileRequest(req, res) {
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
      debug = config.debug;
    }

    if (fn === "reset.html") { /* ehh */
      minifier.clearCache();
      config.appCache.version = 0;
      res.writeHead(200);
      res.end('minifier cache reset ' + Math.random());
      return;
    }

    if (fn === "" || fn.indexOf("..") > -1) {
      fn = "index.html";
    }

    /* shared functionality actually lives in the parent directory,
    so look for it there. */
    if (fn.indexOf("shared/") > -1) {
      fn = "../../" + fn;
    }

    /* determine the MIME type we'll write in the response */
    var mimeType = util.getMimeType(fn);

    fn = path.resolve(root + '/' + fn);

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
          if (fn.split('/').pop() !== "index.html") {
            fileCache.put(fn, responseEncoding, data);
          }
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

    var fileReadHandler = function(err, data) {
      /* read failed */
      if (err || !data) {
        res.writeHead(500);
        return res.end('error loading: ' + fn);
      }

      if (fn.match(/.*\.less$/)) {
        minifier.minifyLessData(data, fn, function(error, data) {
          writeResponse(fn, data || '');
        });
      }
      else if (fn.match(/.*\.html$/)) {
        data = data.toString();

        /* appcache only included in document if we're not hitting a debug
        url and there's an appcache version. if there's no appcache version,
        that means the cache hasn't finished generating yet, so we'll serve
        up a regular document; in most of these cases this will be a 'warming
        up' message. */
        var appCacheEnabled = (config.appCache.enabled);
        var appCacheVersion = config.appCache.version ? config.appCache.version.getTime() : 0;
        data = data.replace("{{manifest}}", (!debug && appCacheEnabled && appCacheVersion) ? 'autom8.appcache' : '');
        data = data.replace("{{version}}", appCacheVersion);

        data = minifier.renderTemplates(data);

        if (debug) {
          data = minifier.renderNonMinifiedStyles(data);
          data = minifier.renderNonMinifiedScripts(data);
          writeResponse(fn, data);
        }
        else {
          data = minifier.renderMinifiedStyles(data, function(withStyles) {
            if (withStyles instanceof Error) {
              writeResponse(fn, STATIC_PAGES.compiling);
              return;
            }

            data = minifier.renderMinifiedScripts(withStyles, function(withScripts) {
              if (withScripts instanceof Error) {
                writeResponse(fn, STATIC_PAGES.compiling);
                return;
              }

              if (!config.appCache.version) {
                config.appCache.version = new Date();
              }

              writeResponse(fn, withScripts);
            });
          });
        }
      }
      else {
        writeResponse(fn, data);
      }
    };

    if (cachedFile) {
      writeResponse(fn, cachedFile, {fromCache: true});
    }
    else {
      fs.readFile(fn, fileReadHandler);
    }
  }

  function create() {
    /* the one and only application */
    var app = express();

    /* connection validator */
    app.use(function(req, res, next) {
      if (!blacklist.allowConnection(req)) {
        res.writeHead(401);
        res.end(STATIC_PAGES.blacklisted);
      }
      else {
        next();
      }
    });

    /* magic middleware */
    app.use(express.cookieParser(config.server.cookieSecret));
    app.use(express.bodyParser());
    app.authCookieName = 'connect.sid-' + config.server.port;

    /* maps browser sessions to socket connections. doing this allows us
    to correlate browser sessions with web sockets. note: this must come
    *after* initializing the express.cookieParser with the same secret key */
    var sessionStore = new express.session.MemoryStore();
    app.use(express.session({
      store: sessionStore,
      secret: config.server.cookieSecret,
      key: app.authCookieName
    }));

    /* start the http server */
    var serverOptions = {
      key: fs.readFileSync(config.server.pem),
      cert: fs.readFileSync(config.server.pem)
    };

    app.httpServer = require('https').createServer(serverOptions, app);
    app.sessionStore = sessionStore;

    /* magic method we add to the express instance to get the server started.
    we do this so other parts of the code can do things like attach event
    handlers before starting */
    app.start = function() {
      /* standard request handlers for various bits of shared functionality */
      require('./Auth.js').add(app);
      require('./AppCache.js').add(app);

      /* general request handler; looks at the request, figures out which file
      to return. Deals with caching, compression, and unathenticated clients.
      make sure we do this as late as possible, to give the calling application
      a chance to register its own handlers first... */
      app.get(/.*/, fileRequest);

      app.httpServer.listen(config.server.port);
    };

    return app;
  }

  exports.create = create;
}());
