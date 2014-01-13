/*
 * Encapsulated file cache for the server. This will be used to
 * cache file contents so we don't have to go do disk every time
 * a request is made.
 *
 * Disabled in debug mode.
 */
(function() {
  var TAG = '[file cache]'.green;

  var cache = { };

  module.exports = exports = {
    get: function (fn, encoding) {
      cache[encoding] = cache[encoding] || { };
      var result = cache[encoding][fn];
      console.log(TAG, result ? 'hit' : 'miss', fn.grey);
      return result;
    },

    put: function (fn, encoding, data) {
      cache[encoding] = cache[encoding] || { };
      cache[encoding][fn] = data;
    },

    clear: function() {
      console.log(TAG, 'cleared');
      cache = { };
    }
  };
}());
