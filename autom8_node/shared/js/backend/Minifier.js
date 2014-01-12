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

    var typesRegex = new RegExp(".*\\.(" + types.join("|") + ")$");

    var path = root + '/templates/';

    if (fs.existsSync(path)) {
      var files = fs.readdirSync(path) || [];
      var contents;

      for (var i = 0; i < files.length; i++) {
        if (files[i].match(typesRegex)) {
          contents = fs.readFileSync(path + files[i]).toString() + "\n\n";
          doc = doc.replace("{{" + files[i] + "}}", contents);
        }
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
    console.log("renderMinifiedStyles: starting");

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
        console.log("renderMinifiedStyles: finalizing");
        doc = doc.replace("{{minified_styles}}", "<style>" + minified + "</style>");
        doc = doc.replace(/\{\{.*\.styles\}\}/g, "");

        if (callback) {
          callback(doc);
          console.log("renderMinifiedStyles: finished");
        }
      };

      /* short circuit if there are no files to process */
      if (!cssFiles.length) {
        finalize('');
        return;
      }

      var minify = function() {
        console.log("renderMinifiedStyles: concatenating compiled files");
        var combined = "";
        for (var i = 0 ; i < cssFiles.length; i++) {
          var data = outputCache[cssFiles[i].name] || "";
          combined += data + "\n";
        }

        console.log("renderMinifiedStyles: minifying concatenated result");
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
            console.log("LESS: CSS parse failed because " + err);
          }

          if (!remaining) {
            minify();
          }
        };
      };

      for (var i = 0; i < cssFiles.length; i++) {
        var file = cssFiles[i];
        if (file.type === "css") {
          outputCache[file.name] = file.data;
          --remaining;
        }
        else if (file.type === "less") {
          try {
            console.log('processing: ' + file.name);
            parser = createLessParser(file.name);
            parser.parse(file.data, createParseFinishHandler(file.name));
          }
          catch(exception) {
            console.log('exception during less.parse(): ' + exception);
          }
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
        var name = root + '/' + match[1];
        cssFiles.push({
          data: fs.readFileSync(name).toString(),
          type: match[1].split('.')[1],
          name: name
        });
      }
    }

    processCss(cssFiles);
  }

  function renderMinifiedScripts(doc, callback) {
    console.log("renderMinifiedScripts: started");

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
    console.log("renderMinifiedScripts: finding scripts");
    for (var i = 0; i < lines.length; i++) {
      match = lines[i].match(scriptRegex);
      if (match && match.length === 2) {
        if (!minifiyBlacklist[match[1]]) {
          var fn = match[1];

          if (fn.indexOf("shared/") === 0) { /* bleh */
            fn = "../../" + fn;
          }

          scriptFilenames.push(root + '/' + fn);
        }
      }
    }

    var minified = "";

    /* render all the blacklisted <script> tags */
    console.log("renderMinifiedScripts: applying blacklist");
    for (var k in minifiyBlacklist) {
      if (minifiyBlacklist.hasOwnProperty(k)) {
        minified += '<script src="' + k + '" type="text/javascript"></script>\n';
      }
    }

    var minificationCompleteHandler = function(error, result) {
      console.log("renderMinifiedScripts: finalizing");
      if (error) {
        console.log('closure compiler output:');
        console.log(error);
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
        console.log("renderMinifiedScripts: finished");
      }
    };

    if (!scriptFilenames.length) {
      console.log("renderMinifiedScripts: nothing to process");
      callback('');
    }
    else {
      console.log("renderMinifiedScripts: starting closurecompiler");
      closurecompiler.compile(scriptFilenames, { }, minificationCompleteHandler);
    }
  }

  module.exports = exports = {
    createLessParser: createLessParser,
    renderTemplates: renderTemplates,
    renderNonMinifiedScripts: renderNonMinifiedScripts,
    renderNonMinifiedStyles: renderNonMinifiedStyles,
    renderMinifiedStyles: renderMinifiedStyles,
    renderMinifiedScripts: renderMinifiedScripts
  };

}());
