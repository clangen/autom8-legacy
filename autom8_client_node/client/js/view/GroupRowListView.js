namespace("autom8.view").GroupRowListView = (function() {
  var EXPAND_DURATION_PER_ITEM = 0.075;
  var MAX_TOTAL_EXPAND_DURATION = 0.25;

  var View = autom8.mvc.View;

  /* remember which groups are expanded, this will be restored when
  the application restarts */
  var expandedGroups = { };

  try {
    expandedGroups = JSON.parse(localStorage['autom8.expandedGroups']);
  }
  catch (ex) {
    /* can't do anything, move on... */
  }

  function storeCollapsedState(groupName, collapsed) {
    if (collapsed) {
      delete expandedGroups[groupName];
    }
    else {
      expandedGroups[groupName] = 1;
    }

    /* remember which groups are expanded so we can restore this
    state whenever we are reloaded */
    try {
      localStorage['autom8.expandedGroups'] = JSON.stringify(expandedGroups);
    }
    catch (ex) {
      console.log('failed to write group view info to localStorage');
    }
  }

  function setCollapsed(context, collapsed) {
    context.collapsed = collapsed;
    if (!collapsed && context.pendingResume) {
      context.pendingResume = false;
      context.resume();
    }
    else if (collapsed) {
      context.pendingResume = !context.paused;
      context.pause();
    }
  }

  /* whenever this view is "collapsed" we are in a frozen/perma-paused
  state until it is expanded. this way we have a mechanism for not
  updating sub-items when they are not visible. */
  return View.extend({
    className: 'device-group-devices',

    onCreate: function(options) {
      this.group = options.group;
      this.collapsed = !expandedGroups[this.group.name()];

      /* hacky: set the initial state so the user doesn't see any flashing.
      if we know w're collapsed, just hide ourself right away. */
      if (this.collapsed) {
        this.$el.css({display: 'none'});
      }

      /* after we set the initial state, set the initial size of the div
      explicitly. this is required for the collapse/expand animation to
      work properly */
      _.defer(_.bind(function() {
        this.$el.css("height", this.collapsed ? 0 : this.$el.height());
        this.$el[this.collapsed ? 'hide' : 'show']();
      }, this));
      /* end hack */
    },

    toggleCollapsed: function(options) {
      var $items = this.$el;

      var group = this.group;
      var groupDevices = group.deviceList();

      /* toggle the collapsed state */
      var collapse = !this.collapsed;

      /* remember group collapsed state and set the expander badge.
      this structure will be serialized, then restored on application
      startup */
      storeCollapsedState(group.name(), collapse);

      /* if animations are enabled, start it now */
      if (autom8.Config.display.animations.collapse) {
        var duration = Math.min(
          MAX_TOTAL_EXPAND_DURATION,
          groupDevices.length * EXPAND_DURATION_PER_ITEM);

        var easing = collapse ?
          autom8.Config.display.animations.collapseEasing :
          autom8.Config.display.animations.expandEasing;

        autom8.Animation.css($items, "toggle-group-" + group.name, {
          hwAccel: false,
          duration: duration,
          property: 'height',
          easing: easing,
          onPrepared: function() {
            if (collapse) {
              $items.css("height", 0);
            }
            else {
              $items.show();
              $items.css("height", "");
              $items.css("height", $items.height());
            }
          },
          onCompleted: _.bind(function(canceled) {
            if (!canceled) {
              $items[collapse ? 'hide' : 'show']();
              this[collapse ? 'pause' : 'resume']();
              setCollapsed(this, collapse);
            }
          }, this)
        });
      }
      /* no animation, just toggle visibility */
      else {
        $items[collapse ? 'hide' : 'show']();
        $items.css("height", "auto");
        this[collapse ? 'pause' : 'resume']();
        setCollapsed(this, collapse);
      }

      this.collapsed = collapse;
      return this.collapsed;
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