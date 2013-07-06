(function() {
  var exports = { };

  var vendorPrefixes = ['', '-webkit-', '-moz-'];

  var events = {
    'transitionend': 'webkitTransitionEnd transitionend otransitionend',
    'animationend': 'webkitAnimationEnd animationend oanimationend',
    'animationstart': 'webkitAnimationStart animationstart oanimationstart'
  };

  function setStyle($el, name, value) {
    var styles = { };
    for (var i = 0; i < vendorPrefixes.length; i++) {
      styles[vendorPrefixes[i] + name] = value || '';
    }
    $el.css(styles);
  }

  function getStyle($el, name) {
    var styles = { };
    for (var i = 0; i < vendorPrefixes.length; i++) {
      var key = vendorPrefixes[i] + name;
      styles[key] = $el.css(key) || '';
    }
    return styles;
  }

  exports.css =  (function() {
    var pending = { };

    return function($div, name, options) {
      options = options || { };

      var failsafeTimeout = null;
      var canceled = false;
      var finished = false;

      var onTransitionEnd = function() {
        if (finished) {
          return; /* already completed. the failsafe probably fired... */
        }

        clearTimeout(failsafeTimeout);
        failsafeTimeout = null;

        delete pending[name];
        finished = true;

        if (options.keyframes) {
          $div.css(oldAnimation);
          $div.unbind(events['animationend'], onTransitionEnd);
        }
        else {
          $div.css(oldTransition);
          $div.unbind(events['transitionend'], onTransitionEnd);
        }

        if (options.hwAccel) {
          var $hwAccelEl = options.$hwAccelEl || $div;
          $div.css(oldTransform);
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
        $div.bind(events['animationend'], onTransitionEnd);
      }
      else {
        $div.bind(events['transitionend'], onTransitionEnd);
      }

      if (options.onBeforeStarted) {
        options.onBeforeStarted();
      }

      var oldTransform;
      if (options.hwAccel) {
        oldTransform = getStyle($div, 'transform'); // $div.css('-webkit-transform');

        var $hwAccelEl = options.$hwAccelEl || $div;
        setStyle($div, 'transform', 'translate3d(0, 0, 0)');
      }

      var easing = options.easing || "ease";
      var duration = options.duration ? options.duration : 0.5;

      /* these values will be restored when the animation has completed */
      var oldTransition = getStyle($div, 'transition');
      var oldAnimation = getStyle($div, 'animation');

      if (options.keyframes) {
        setStyle($div, 'animation', options.keyframes + ' ' + String(duration) + 's ' + easing);
      }
      else {
        var property = options.property || "all";
        setStyle($div, 'transition', property + ' ' + String(duration) + 's ' + easing);
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