autom8.Touchable = {
  add: function(rootSelector, itemSelector, clickHandler) {
    var startX = 0, startY = 0;
    var endX = 0, endY = 0;
    $(rootSelector).delegate(itemSelector, 'touchstart', function(e) {
      var target = $(e.currentTarget);
      if (target && !target.hasClass("touched")) {
        startX = endX = e.originalEvent.touches[0].clientX;
        startY = endY = e.originalEvent.touches[0].clientY;
        target.addClass("touched");
      }
    });

    $(rootSelector).delegate(itemSelector, 'touchmove', function(e) {
      endX = e.originalEvent.touches[0].clientX;
      endY = e.originalEvent.touches[0].clientY;
    });

    $(rootSelector).delegate(itemSelector, 'touchend touchcancel', function(e) {
      var target = $(e.currentTarget);
      if (target && target.hasClass("touched")) {
        target.removeClass("touched");
        dx = Math.abs(startX - endX);
        dy = Math.abs(startY - endY);

        if (clickHandler && dx < 10 && dy < 10) {
          clickHandler(e);
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