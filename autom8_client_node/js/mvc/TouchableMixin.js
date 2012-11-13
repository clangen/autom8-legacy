 (function() {
  var touchSupported = !!document.createTouch;
  var startEvent = touchSupported ? "touchstart" : "mousedown mouseenter";
  var moveEvent = touchSupported ? "touchmove" : "mousemove";
  var endEvent = touchSupported ? "touchend touchcancel" : "mouseup mouseleave";  

  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  function add(context, el, selector, touchHandler) {
    var started = null;
    var startX = 0, startY = 0;
    var endX = 0, endY = 0;
    var $el = _.isString(el) ? $(el) : el;

    /* start */
    $el.delegate(selector, startEvent, function(e) {
      var target = $(e.currentTarget);
      /* mouse-specific, used to reset states after detecting an
      unsent mouseleave while touched. we'll be called with a mousedown
      at some point in the future to begin again. */
      if (e.type === "mouseenter") {
        if (started && e.which === 0) {
            /* cursor no longer down, but was; we just detected an
            out-of-order mouseenter event. reset our state */
            started = null; 
        }
        if (started === e.currentTarget) {
          /* dragged outside bounds, then back. re-add touch class */
          target.addClass("touched");
        }
      }
      else if (!started) {
        started = e.currentTarget;

        if (touchSupported) {
          startX = endX = e.originalEvent.touches[0].clientX;
          startY = endY = e.originalEvent.touches[0].clientY;
        }
        else {
          startX = endX = e.originalEvent.clientX;
          startY = endY = e.originalEvent.clientY;
        }

        target.addClass("touched");
      }
    });

    /* move */
    $el.delegate(selector, moveEvent, function(e) {
      if (started) {
        if (touchSupported) {
          endX = e.originalEvent.touches[0].clientX;
          endY = e.originalEvent.touches[0].clientY;        
        }
        else {
          endX = e.clientX;
          endY = e.clientY;      
        }
      }
    });

    /* end */
    $el.delegate(selector, endEvent, function(e) {
      var target = $(e.currentTarget);
      if (started) {
        target.removeClass("touched");

        if (e.type !== "mouseleave") {
          started = null;
          dx = Math.abs(startX - endX);
          dy = Math.abs(startY - endY);

          if (touchHandler && dx < 20 && dy < 20) {
            touchHandler.call(context, e);
          }
        }
      }
    });
  }

  function remove(el, selector) {
    var $el = _.isString(el) ? $(el) : el;
    $el.undelegate(selector, startEvent);
    $el.undelegate(selector, moveEvent);
    $el.undelegate(selector, endEvent);
  }

  autom8.mvc.mixins.Touchable = {
    'class': {
      addTouchable: function(el, selector, touchHandler, context) {
        add(context, el, selector, touchHandler);
      },

      removeTouchable: function(el, selector) {
        remove(el, selector);
      }
    },

    'lifecycle': {
      onDelegateEvents: function(events) {
        var self = this;
        this.__touchables = [];
        _.each(events, function(value, key) {
          var match = key.match(delegateEventSplitter);
          if (match && match.length === 3 && match[1] === "touch") {
            add(self, self.$el, match[2], value);
            self.__touchables.push(match[2]);
          }
        });
      },

      onUndelegateEvents: function() {
        var $el = this.$el;
        _.each(this.__touchables, function(touchable) {
          remove($el, touchable);
        });
        this.__touchables = [];
      }
    }
  }
}());