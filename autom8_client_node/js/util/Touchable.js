autom8.Touchable = (function() {
  var touchSupported = !!document.createTouch;
  var startEvent = touchSupported ? "touchstart" : "mousedown mouseenter";
  var moveEvent = touchSupported ? "touchmove" : "mousemove";
  var endEvent = touchSupported ? "touchend touchcancel" : "mouseup mouseleave";  

  return {
    add: function(rootSelector, itemSelector, touchHandler) {
      var started = null;
      var startX = 0, startY = 0;
      var endX = 0, endY = 0;

      /* start */
      $(rootSelector).delegate(itemSelector, startEvent, function(e) {
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
      $(rootSelector).delegate(itemSelector, moveEvent, function(e) {
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
      $(rootSelector).delegate(itemSelector, endEvent, function(e) {
        var target = $(e.currentTarget);
        if (started) {
          target.removeClass("touched");

          if (e.type !== "mouseleave") {
            started = null;
            dx = Math.abs(startX - endX);
            dy = Math.abs(startY - endY);

            if (touchHandler && dx < 20 && dy < 20) {
              touchHandler(e);
            }
          }
        }
      });
    },

    remove: function(rootSelector, itemSelector) {
      $(rootSelector).undelegate(itemSelector, startEvent);
      $(rootSelector).undelegate(itemSelector, moveEvent);
      $(rootSelector).undelegate(itemSelector, endEvent);
    }
  };
}());