 (function() {
  var touchSupported = !!document.createTouch;
  var startEvent = touchSupported ? "touchstart{{suffix}}" : "mousedown{{suffix}} mouseover{{suffix}}";
  var moveEvent = touchSupported ? "touchmove{{suffix}}" : "mousemove{{suffix}}";
  var endEvent = touchSupported ? "touchend{{suffix}} touchcancel{{suffix}}" : "mouseup{{suffix}} mouseout{{suffix}}";

  var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  var touchEventNamespace = ".delegateTouchEvent";

  function suffix(event, cid) {
    return event.replace(/\{\{suffix\}\}/g, touchEventNamespace + (cid || ""));
  }

  function add(context, el, selector, cid, touchHandler) {
    var started = null;
    var startX = 0, startY = 0;
    var endX = 0, endY = 0;
    var $el = _.isString(el) ? $(el) : el;

    /* start */
    $el.delegate(selector, suffix(startEvent, cid), function(e) {
      var target = $(e.currentTarget);
      /* mouse-specific, used to reset states after detecting an
      unsent mouseleave while touched. we'll be called with a mousedown
      at some point in the future to begin again. */
      if (e.type === "mouseover") {
        if (started && e.which === 0) {
            /* cursor no longer down, but was; we just detected an
            out-of-order mouseover event. reset our state */
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

      /* prevents parent touchables from capturing this event */
      e.stopImmediatePropagation();
    });

    /* move */
    $el.delegate(selector, suffix(moveEvent, cid), function(e) {
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
    $el.delegate(selector, suffix(endEvent, cid), function(e) {
      if (started) {
        var target = $(e.currentTarget);
        target.removeClass("touched");

        if (e.type !== "mouseout") {
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

  function remove(el, selector, cid, touchHandler) {
    var $el = _.isString(el) ? $(el) : el;
    $el.undelegate(selector, suffix(startEvent, cid), touchHandler);
    $el.undelegate(selector, suffix(moveEvent, cid), touchHandler);
    $el.undelegate(selector, suffix(endEvent, cid), touchHandler);
  }

  namespace("autom8.mvc.mixins").Touchable = {
    'class': {
      addTouchable: function(el, selector, touchHandler, context) {
        add(context, el, selector, null, touchHandler);
      },

      removeTouchable: function(el, selector, touchHandler) {
        remove(el, selector, null, touchHandler);
      }
    },

    'lifecycle': {
      onDelegateEvents: function(events) {
        var self = this;
        _.each(events, function(value, key) {
          var match = key.match(delegateEventSplitter);
          if (match && match.length === 3 && match[1] === "touch") {
            add(self, self.$el, match[2], self.cid, value);
          }
        });
      },

      onUndelegateEvents: function() {
        this.$el.unbind(touchEventNamespace + this.cid);
      }
    }
  };
}());