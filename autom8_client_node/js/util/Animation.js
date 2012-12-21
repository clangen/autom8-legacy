(function() {
  var exports = { };

  exports.animate =  (function() {
    var pending = { };

    return function($div, name, options) {
      options = options || { };

      var failsafeTimeout = null;
      var canceled = false;
      var finished = false;
      var onTransitionEnd = function() {
        if (finished) {
          return; /* animation was canceled before this was raised */
        }

        clearTimeout(failsafeTimeout);
        failsafeTimeout = null;

        delete pending[name];
        finished = true;
        
        $div.css('-webkit-transition', oldStyle || "");
        $div.unbind('webkitTransitionEnd', onTransitionEnd);

        if (options.hwAccel) {
          var $hwAccelEl = options.$hwAccelEl || $div;

          $hwAccelEl.css({
            '-webkit-backface-visibility': oldBackfaceVisibility,
            '-webkit-perspective': oldPerspective
          });
        }

        if (options.onCompleted) {
          options.onCompleted(canceled);
        }
      };

      if (pending[name] && options.interrupt !== false) {
        pending[name].cancel();
        pending[name] = null;
      }

      pending[name] = {
        cancel: function() {
          canceled = true;
          onTransitionEnd();
        }
      };

      if (options.initialClass) {
        $div.addClass(options.initialClass);
      }

      /* invoked when animation finishes */
      $div.bind('webkitTransitionEnd', onTransitionEnd);

      var oldBackfaceVisibility, oldPerspective;
      if (options.hwAccel) {
        oldBackfaceVisibility = $div.css('-webkit-backface-visibility') || '';
        oldPerspective = $div.css('-webkit-perspective') || '';

        var $hwAccelEl = options.$hwAccelEl || $div;
        $hwAccelEl.css({
          '-webkit-backface-visibility': 'hidden',
          '-webkit-perspective': 1000
        });
      }

      var oldStyle = $div.css('-webkit-transition');
      var property = options.property || "all";
      var easing = options.easing || "ease";
      var duration = options.duration ? options.duration : 0.5;
      $div.css('-webkit-transition', property + ' ' + String(duration) + 's ' + easing);

      if (options.onBeforeStarted) {
        options.onBeforeStarted();
      }

      if (options.toggleClass) {
        $div.toggleClass(options.toggleClass);

        if (options.onStarted) {
          options.onStarted();
        }
      }

      /* just in case the animation never actually starts */
      failsafeTimeout = setTimeout(onTransitionEnd, duration * 1000 * 2);
    };
  }());

  namespace('autom8').Animation = exports;
}());