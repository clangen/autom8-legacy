autom8.Touchable = {
  add: function(rootSelector, itemSelector, clickHandler) {
    var touchSupported = !!document.createTouch;
    var startEvent = touchSupported ? "touchstart" : "mousedown";
    var moveEvent = touchSupported ? "touchmove" : "mousemove";
    var endEvent = touchSupported ? "touchend touchcancel" : "mouseup mouseout";
    var started = false;
    var touchedAdded = false;

    var startX = 0, startY = 0;
    var endX = 0, endY = 0;
    $(rootSelector).delegate(itemSelector, startEvent, function(e) {
      var target = $(e.currentTarget);
      if (!started) {
        started = true;

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

    $(rootSelector).delegate(itemSelector, endEvent, function(e) {
      var target = $(e.currentTarget);
      if (started) {
        started = false;
        target.removeClass("touched");

        if (e.type !== "mouseout") {
          dx = Math.abs(startX - endX);
          dy = Math.abs(startY - endY);

          if (clickHandler && dx < 10 && dy < 10) {
            clickHandler(e);
          }
        }
      }
    });
  },

  remove: function(rootSelector, itemSelector) {
    $(rootSelector).undelegate(itemSelector, 'touchstart');
    $(rootSelector).undelegate(itemSelector, 'touchmove');
    $(rootSelector).undelegate(itemSelector, 'touchend touchcancel');
  }
};