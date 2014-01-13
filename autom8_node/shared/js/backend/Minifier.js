/*
 * Object which encapsulates all of the https server logic. Exposes
 * a single "start()" method that should be called befoore starting
 * the client.
 */
(function() {
  var fs = require('fs');
  var io = require('socket.io');
  var less = require('less');
  var path = require('path');
  var closurecompiler = require('closurecompiler');
  var config = require('./Config.js').get();

  var CSS = "[minifier-css]".blue;
  var JS = "[minifier-js]".blue;
  var LESS = "[minifier-less]".blue;

  var root = process.cwd() + '/frontend';

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
    var path = root + '/templates/';

    if (fs.existsSync(path)) {
      var files = fs.readdirSync(path) || [];
      for (var i = 0; i < files.length; i++) {
        if (files[i].match(/.*\.html$/)) {
          result += fs.readFileSync(path + files[i], "utf8");
          result += "\n\n";
        }
      }
    }

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
    console.log(CSS, "minification starting");

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
        // console.log(CSS, "minification finalizing");
        doc = doc.replace("{{minified_styles}}", "<style>" + minified + "</style>");
        doc = doc.replace(/\{\{.*\.styles\}\}/g, "");

        if (callback) {
          callback(doc);
          console.log(CSS, "minification finished");
        }
      };

      /* short circuit if there are no files to process */
      if (!cssFiles.length) {
        finalize('');
        return;
      }

      var minify = function() {
        console.log(CSS, "concatenating files");

        var combined = "";
        for (var i = 0 ; i < cssFiles.length; i++) {
          var data = outputCache[cssFiles[i].name] || "";
          combined += data + "\n";
        }

        console.log(CSS, "minifying concatenated result");

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
            console.log(LESS, "parse failed because " + err);
          }

          if (!remaining) {
            minify();
          }
        };
      };

      for (var i = 0; i < cssFiles.length; i++) {
        var file = cssFiles[i];
        console.log(LESS, 'processing: ' + file.name);

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
            console.log(LESS, 'exception during less.parse()', exception);
          }
        }
        else {
          console.log(CSS, 'asked to process unknown style, ignoring', cssFiles[i].name);
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
    console.log(JS, "minification started");

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
    console.log(JS, "minification discovering files");
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
    console.log(JS, "applying minification blacklist");
    for (var k in minifiyBlacklist) {
      if (minifiyBlacklist.hasOwnProperty(k)) {
        minified += '<script src="' + k + '" type="text/javascript"></script>\n';
      }
    }

    var minificationCompleteHandler = function(error, result) {
      // console.log(JS, "minification finalizing");
      if (error) {
        console.log(JS, 'closure compiler warnings and errors', error);
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
        callback(doc);
        console.log(JS, "minification finished");
      }
    };

    if (!scriptFilenames.length) {
      console.log(JS, "nothing to minify");
      callback('');
    }
    else {
      console.log(JS, "running closurecompiler");
      closurecompiler.compile(scriptFilenames, { }, minificationCompleteHandler);
    }
  }

  function minifyLessData(data, fn, callback) {
    /* fn is required so when we parse this blob, less will know to look in
    the same directory for @includes */
    var parser = createLessParser(fn);

    console.log(LESS, "processing file", fn.grey);
    parser.parse(data.toString(), function (err, tree) {
        if (!err) {
          // console.log(LESS, "finished processing", fn.grey);
          data = tree.toCSS();
          callback(false, data);
        }
        else {
          console.log(LESS, "parse failed because ", require('util').inspect(err));
          callback(true);
        }
    });
  }

  module.exports = exports = {
    createLessParser: createLessParser,
    minifyLessData: minifyLessData,
    renderTemplates: renderTemplates,
    renderNonMinifiedScripts: renderNonMinifiedScripts,
    renderNonMinifiedStyles: renderNonMinifiedStyles,
    renderMinifiedStyles: renderMinifiedStyles,
    renderMinifiedScripts: renderMinifiedScripts
  };

}());
