namespace("autom8.view").GroupRowListView = (function() {
  var View = autom8.mvc.View;

  /* whenever this view is "collapsed" we are in a frozen/perma-paused
  state until it is expanded. this way we have a mechanism for not
  updating sub-items when they are not visible. */
  return View.extend({
    onCreate: function(options) {
      this.collapsed = options.collapsed || false;
    },

    setCollapsed: function(collapsed) {
      this.collapsed = collapsed;
      if (!collapsed && this.pendingResume) {
        this.pendingResume = false;
        this.resume();
      }
      else if (collapsed) {
        this.pendingResume = !this.paused;
        this.pause();
      }
    },

    resume: function(options) {
      if (this.collapsed) {
        this.pendingResume = true;
        return;
      }

      View.prototype.resume.call(this, options);
    },

    pause: function(options) {
      this.pendingResume = false;
      View.prototype.pause.call(this, options);
    }
  });
}());