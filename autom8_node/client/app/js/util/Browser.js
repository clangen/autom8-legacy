(function() {
  var vendorPrefixes = ['', '-webkit-', '-moz-'];

  var exports = {
    createPrefixedStyle: function(name, value) {
      var styles = { };

      for (var i = 0; i < vendorPrefixes.length; i++) {
        var key = vendorPrefixes[i] + name;
        styles[key] = value || '';
      }

      return styles;
    },

    getPrefixedStyle: function($el, name) {
      var styles = { };

      for (var i = 0; i < vendorPrefixes.length; i++) {
        var key = vendorPrefixes[i] + name;
        styles[key] = $el.css(key) || '';
      }

      return styles;
    },

    setPrefixedStyle: function($el, name, value) {
      var styles = { };

      for (var i = 0; i < vendorPrefixes.length; i++) {
        styles[vendorPrefixes[i] + name] = value || '';
      }

      $el.css(styles);
    }
  };

  namespace('autom8').Browser = exports;
}());
