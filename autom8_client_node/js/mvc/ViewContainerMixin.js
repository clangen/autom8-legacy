(function() {
  namespace("autom8.mvc.mixins").ViewContainer = {
    'prototype': {
      addView: function(view, options) {
        options = options || { };
      },

      removeView: function(view, options) {
        options = options || { };
      }
    },

    'lifecycle': {
      onCreate: function(options) {
        this.views = [];
      }
    }
  };
}());