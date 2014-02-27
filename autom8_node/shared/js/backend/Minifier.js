var fs = require('fs');
var io = require('socket.io');
var less = require('less');
var path = require('path');
var closurecompiler = require('closurecompiler');
var config = require('./Config.js').get();
var log = require('./Logger.js');

var CSS = "[minifier]".blue;
var JS = "[minifier]".blue;
var LESS = "[minifier]".blue;

var COMPILING = new Error({message: 'compiling, try again in a few'});

var closureCompileRunning = false;
var cached = {styles: '', scripts: '', version: 0};

var root = process.cwd() + '/frontend';
var shared = process.cwd() + '/../shared';
var cache = process.cwd() + '/minifier.cache';

function writeCacheFile() {
  if (cached.styles && cached.scripts) {
    cached.version = Date.now();
  }

  try {
    fs.writeFileSync(cache, JSON.stringify(cached));
  }
  catch (e) {
    log.error(JS, 'failed to write', cache);
  }
}

function readCacheFile() {
  var parsed = { };

  try {
    parsed = JSON.parse(fs.readFileSync(cache));
  }
  catch (e) {
    log.error(JS, 'failed to read', cache);
  }

  cached = {
    styles: parsed.styles || '',
    scripts: parsed.scripts || '',
    version: parsed.version || 0
  };
}

function createLessParser(filename, paths) {
    filename = filename || "";
    paths = paths || [];
    paths.push(path.dirname(filename));

    return new less.Parser({
      paths: paths
    });
}

function renderTemplates(doc) {
  var result = "";

  var concat = function(path) {
    if (fs.existsSync(path)) {
      var files = fs.readdirSync(path) || [];
      for (var i = 0; i < files.length; i++) {
        if (files[i].match(/.*\.html$/)) {
          result += fs.readFileSync(path + files[i], "utf8");
          result += "\n\n";
        }
      }
    }
  };

  concat(root + '/templates/');
  concat(shared + '/templates/');

  return doc.replace("{{templates}}", result);
}

function renderScripts(doc, types) {
  types = types || ['scripts', 'styles'];

  if (typeof types === 'string') {
    types = [types];
  }

  var i;
  var files = [];
  var typesRegex = new RegExp(".*\\.(" + types.join("|") + ")$");

  /* given a path, adds all the .scripts, .styles, .html files
  to the files array declared just above */
  var addTemplates = function(newPath) {
    if (fs.existsSync(newPath)) {
      var newFiles = fs.readdirSync(newPath) || [];
      for (i = 0; i < newFiles.length; i++) {
        files.push({
          path: newPath + '/' + newFiles[i],
          name: newFiles[i]
        });
      }
    }
  };

  /* more specific comes first */
  addTemplates(path.resolve(root + '/templates/'));
  addTemplates(path.resolve(root + '/../../shared/templates'));

  /* do the replacement */
  var contents;
  for (i = 0; i < files.length; i++) {
    if (files[i].name.match(typesRegex)) {
      contents = fs.readFileSync(files[i].path).toString() + "\n\n";
      doc = doc.replace("{{" + files[i].name + "}}", contents);
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

function renderMinifiedStyles(doc, callback) {
  if (cached.styles) {
    log.info(CSS, "rendered styles cache hit".green);
    doc = doc.replace("{{minified_styles}}", "<style>" + cached.styles + "</style>");
    doc = doc.replace(/\{\{.*\.styles\}\}/g, "");
    callback(doc);
    return;
  }

  log.info(CSS, "processing css");

  /* separate the rendered scripts into an array of lines. we'll use
  this to build a list of all the .css files that we will minify */
  var lines = renderScripts(doc).split(/\r\n|\n/);

  /* key: filename, value: processed css string */
  var outputCache = { };

  /* compiles css with less, if applicable, then minifies */
  var processCss = function(cssFiles) {
    var parser;
    var remaining = cssFiles.length;

    var finalize = function(minified) {
      doc = doc.replace("{{minified_styles}}", "<style>" + minified + "</style>");
      doc = doc.replace(/\{\{.*\.styles\}\}/g, "");

      if (callback) {
        cached.styles = minified;
        writeCacheFile();
        callback(doc);
      }
    };

    /* short circuit if there are no files to process */
    if (!cssFiles.length) {
      finalize('');
      return;
    }

    var minify = function() {
      log.info(CSS, "concatenating");

      var combined = "";
      for (var i = 0 ; i < cssFiles.length; i++) {
        var data = outputCache[cssFiles[i].name] || "";
        combined += data + "\n";
      }

      log.info(CSS, "minifying");

      var CleanCSS = require('clean-css');
      var minified = new CleanCSS().minify(combined);

      finalize(minified);
    };

    var createParseFinishHandler = function(filename) {
      return function(err, tree) {
        --remaining;

        if (!err) {
          outputCache[filename] = tree.toCSS();
        }
        else {
          err = require('util').inspect(err);
          log.error(LESS, "parse failed because " + err);
        }

        if (!remaining) {
          minify();
        }
      };
    };

    for (var i = 0; i < cssFiles.length; i++) {
      var file = cssFiles[i];
      log.info(LESS, 'processing', file.name.grey, '' + (i+1) + ' of ' + cssFiles.length);

      if (file.type === ".css") {
        outputCache[file.name] = file.data;
        --remaining;
      }
      else if (file.type === ".less") {
        try {
          parser = createLessParser(file.name);
          parser.parse(file.data, createParseFinishHandler(file.name));
        }
        catch(exception) {
          log.error(LESS, 'exception during less.parse()', exception);
        }
      }
      else {
        log.warn(CSS, 'asked to process unknown style, ignoring', cssFiles[i].name);
        --remaining;
      }
    }
  };

  /* run through each line, seeing if it's a css file. if it is,
  process it */
  var regex = /.*href="(.*\.css|.*\.less)"/;
  var match;
  var cssFiles = [];

  for (var i = 0; i < lines.length; i++) {
    match = lines[i].match(regex);
    if (match && match.length === 2) {
      if (match[1].indexOf("shared/") === 0) { /* bleh, fixme */
        match[1] = "../../" + match[1];
      }

      var name = path.resolve(root + '/' + match[1]).toString();

      cssFiles.push({
        data: fs.readFileSync(name).toString(),
        type: path.extname(match[1]),
        name: name
      });
    }
  }

  processCss(cssFiles);
}

function renderMinifiedScripts(doc, callback) {
  if (closureCompileRunning) {
    log.warn(JS, "closure compiler already running, bailing".yellow);
    callback(COMPILING);
    return;
  }

  if (cached.scripts) {
    log.info(JS, "closure compiler cache hit".green);
    doc = doc.replace("{{minified_scripts}}", cached.scripts);
    doc = doc.replace(/\{\{.*\.scripts\}\}/g, "");
    callback(doc);
    return;
  }

  log.info(JS, "javascript minification started");

  /* separate the rendered scripts into an array of lines. we'll use
  this to build a list of all the .js files that we will minify */
  var lines = renderScripts(doc).split(/\r\n|\n/);

  /* these are special scripts that we can't safely/easily minify. they
  will be excluded from the minification process and added to the
  document above the minified scripts */
  var minifiyBlacklist = {
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
      if (!minifiyBlacklist[match[1]]) {
        var fn = match[1];

        if (fn.indexOf("shared/") === 0) { /* bleh, fixme */
          fn = "../../" + fn;
        }

        scriptFilenames.push(root + '/' + fn);
      }
    }
  }

  var minified = "";

  /* render all the blacklisted <script> tags */
  log.info(JS, "applying minification blacklist");
  for (var k in minifiyBlacklist) {
    if (minifiyBlacklist.hasOwnProperty(k)) {
      minified += '<script src="' + k + '" type="text/javascript"></script>\n';
    }
  }

  var minificationCompleteHandler = function(error, result) {
    closureCompileRunning = false;
    log.info(JS, "closure compiler finished");

    if (error) {
      log.warn(JS, 'closure compiler warnings and errors', error);
    }

    if (result) {
      minified += '<script type="text/javascript">';
      minified += result;
      minified += '</script>';
    }

    /* toss the minified code into the document, and then
    remove any {{*.script}} identifiers, they have all been
    minified */
    doc = doc.replace("{{minified_scripts}}", minified);
    doc = doc.replace(/\{\{.*\.scripts\}\}/g, "");

    if (callback) {
      cached.scripts = minified;
      writeCacheFile();
    }
  };

  if (!scriptFilenames.length) {
    log.warn(JS, "nothing to minify");
    callback('');
  }
  else {
    log.info(JS, "starting closurecompiler", '(' + scriptFilenames.length + ' files)');
    closurecompiler.compile(scriptFilenames, { }, minificationCompleteHandler);
    closureCompileRunning = true;
    callback(COMPILING);
  }
}

function minifyLessData(data, fn, callback) {
  /* fn is required so when we parse this blob, less will know to look in
  the same directory for @includes */
  var parser = createLessParser(fn);

  log.info(LESS, "processing file", fn.grey);
  parser.parse(data.toString(), function (err, tree) {
      if (!err) {
        data = tree.toCSS();
        callback(false, data);
      }
      else {
        log.error(LESS, "parse failed because ", require('util').inspect(err));
        callback(true);
      }
  });
}

function clearCache() {
  log.info(CSS, "cleared cache".red);
  cached = {styles: '', scripts: '', version: 0};
}

function init() {
  readCacheFile();
}

function getCacheVersion() {
  return cached.version;
}

module.exports = exports = {
  init: init,
  createLessParser: createLessParser,
  minifyLessData: minifyLessData,
  renderTemplates: renderTemplates,
  renderNonMinifiedScripts: renderNonMinifiedScripts,
  renderNonMinifiedStyles: renderNonMinifiedStyles,
  renderMinifiedStyles: renderMinifiedStyles,
  renderMinifiedScripts: renderMinifiedScripts,
  getCacheVersion: getCacheVersion,
  clearCache: clearCache
};