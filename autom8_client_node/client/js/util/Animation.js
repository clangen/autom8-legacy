(function() {
  var exports = { };

  exports.css =  (function() {
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
        
        if (options.keyframes) {
          $div.css('-webkit-animation', oldAnimation || "");
          $div.unbind('webkitAnimationEnd', onTransitionEnd);
        }
        else {
          $div.css('-webkit-transition', oldTransition || "");
          $div.unbind('webkitTransitionEnd', onTransitionEnd);
        }

        if (options.hwAccel) {
          var $hwAccelEl = options.$hwAccelEl || $div;

          $hwAccelEl.css({
            '-webkit-transform': oldTransform
          });
        }

        if (options.onCompleted) {
          options.onCompleted(canceled);
        }

        if (options.onAfterCompleted) {
          _.defer(function() {
            options.onAfterCompleted(canceled);
          });
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
      if (options.keyframes) {
        $div.bind('webkitAnimationEnd', onTransitionEnd);
      }
      else {
        $div.bind('webkitTransitionEnd', onTransitionEnd);
      }

      var oldTransform;
      if (options.hwAccel) {
        oldTransform = $div.css('-webkit-transform');

        var $hwAccelEl = options.$hwAccelEl || $div;
        $hwAccelEl.css({
          '-webkit-transform': 'translate3d(0, 0, 0)'
        });
      }

      if (options.onBeforeStarted) {
        options.onBeforeStarted();
      }

      var easing = options.easing || "ease";
      var duration = options.duration ? options.duration : 0.5;

      /* these values will be restored when the animation has completed */
      var oldTransition = $div.css('-webkit-transition');
      var oldAnimation = $div.css('-webkit-animation');

      if (options.keyframes) {
        $div.css('-webkit-animation', options.keyframes + ' ' + String(duration) + 's ' + easing);
      }
      else {
        var property = options.property || "all";
        $div.css('-webkit-transition', property + ' ' + String(duration) + 's ' + easing);
      }

      if (options.onPrepared) {
        options.onPrepared();
      }

      if (options.toggleClass) {
        $div.toggleClass(options.toggleClass);
      }

      if (options.onStarted) {
        options.onStarted();
      }

      /* webkitAnimationStart appears to be unreliable on iPhone, so we simulate
      it by calling the callback next time through the event loop */
      if (options.onAfterStarted) {
        _.defer(function() {
          options.onAfterStarted();
        });
      }

      /* just in case the animation never actually starts */
      if (options.failsafe !== false) {
        var durationMillis = duration * 1000;
        failsafeTimeout = setTimeout(onTransitionEnd, durationMillis * 2);
      }
    };
  }());

  namespace('autom8').Animation = exports;
}());