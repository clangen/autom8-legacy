/*
 * A collection of utility methods.
 */
(function() {
  var crypto = require('crypto');

  exports.sha256 = function(data) {
    var checksum = crypto.createHash('sha256');
    checksum.update(data);
    return checksum.digest('hex');
  };

  exports.parseCookie = function(str) {
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
  };

  exports.parseQuery = function(query) {
    var result = { };

    if (!query) {
      return result;
    }

    var args = query.split("&");
    for (var i = 0; i < args.length; i++) {
      var parts = args[i].split("=");
      if (parts.length === 2) {
        result[parts[0]] = parts[1];
      }
    }

    return result;
  };

  exports.getMimeType = (function() {
    var fallback = "text/plain";

    var types = {
      ".htm": "text/html",
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".ico": "image/x-icon",
      ".appcache": "text/cache-manifest"
    };

    return function(fn) {
        var last = fn.lastIndexOf(".");
        var extension = (last && -1) &&  fn.substr(last).toLowerCase();
        return (types[extension] || fallback);
    };
  }());
}());