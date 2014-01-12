/*
 * Encapsulated file cache for the server. This will be used to
 * cache file contents so we don't have to go do disk every time
 * a request is made.
 *
 * Disabled in debug mode.
 */
(function() {
  var cache = { };

  module.exports = exports = {
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
