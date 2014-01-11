(function() {
  var Browser = namespace('autom8').Browser;

  var events = {
    'transitionend': 'webkitTransitionEnd transitionend otransitionend',
    'animationend': 'webkitAnimationEnd animationend oanimationend',
    'animationstart': 'webkitAnimationStart animationstart oanimationstart'
  };

  var exports = { };
  var getStyle = Browser.getPrefixedStyle;
  var setStyle = Browser.setPrefixedStyle;

  function waitAtLeast(duration, fn) {
    var start = new Date().getTime();
    return function() {
      var elapsed = new Date().getTime() - start;
      var remain = duration - elapsed;
      if (remain > 0) {
        _.delay(fn, remain);
      }
      else {
        fn();
      }
    };
  }

  exports.css = (function() {
    var pending = { };

    return function($div, name, options) {
      options = options || { };

      var failsafeTimeout = null;
      var canceled = false;
      var finished = false;

      /* waitAtLeast assures buggy browsers don't call the transition end
      event before the duration expires */
      var waitAtLeastMillis = (options.duration || 0) * 1000;
      var onTransitionEnd = waitAtLeast(waitAtLeastMillis, function() {
        if (finished) {
          return; /* already completed. the failsafe probably fired. */
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

        if (options.onCompleted) {
          options.onCompleted(canceled);
        }

        if (options.onAfterCompleted) {
          /* work around browser bugs where timeout is called prematurely;
          don't call callback until the minimum amount of time has expired */
          _.defer(function() {
            options.onAfterCompleted(canceled);
          });
        }
      });

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

      var easing = options.easing || "ease";
      var duration = options.duration ? options.duration : 0.5;

      /* these values will be restored when the animation has completed */
      var oldTransition = getStyle($div, 'transition');
      var oldAnimation = getStyle($div, 'animation');

      /* the defer here is necessary; once we setup the transition
      properties we need to wait for our next run through the event
      loop to apply properties that will be affected */
      _.defer(function() {
        if (options.keyframes) {
          setStyle($div, 'animation', options.keyframes + ' ' + String(duration) + 's ' + easing);
        }
        else {
          var property = options.property || "all";
          setStyle($div, 'transition', property + ' ' + String(duration) + 's ' + easing);
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
      });
    };
  }());

  namespace('autom8').Animation = exports;
}());
