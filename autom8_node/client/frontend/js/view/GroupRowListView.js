namespace("autom8.view").GroupRowListView = (function() {
  var EXPAND_DURATION_PER_ITEM = 0.075;
  var MAX_TOTAL_EXPAND_DURATION = 0.25;
  var CHILD_DEVICE_ROW_HEIGHT = 46 + 1; /* +1 for the border */

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

  function setFinalCollapsedState(context, collapse) {
    var groupName = context.group.name();

    if (collapse) {
      context.$el.hide();
      context.pause();

      delete expandedGroups[groupName];
    }
    else {
      context.$el.css("height", context.height || 0);
      context.$el.show();
      context.resume();

      expandedGroups[groupName] = 1;
    }

    try {
      localStorage['autom8.expandedGroups'] = JSON.stringify(expandedGroups);
    }
    catch (ex) {
      console.log('failed to write group view info to localStorage');
    }
  }

  /* whenever this view is "collapsed" we are in a frozen/perma-paused
  state until it is expanded. this way we have a mechanism for not
  updating sub-items when they are not visible. */
  return View.extend({
    className: 'device-group-devices',
    tagName: 'ul',

    onCreate: function(options) {
      this.group = options.group;
      this.collapsed = !expandedGroups[this.group.name()];
      this.toggleCollapsed({collapse: this.collapsed, animate: false});
    },

    onAddChild: function(options) {
      this.height = (this.$el.children().length * CHILD_DEVICE_ROW_HEIGHT);

      if (!this.collapsed) {
        this.$el.css('height', this.height);
      }
    },

    toggleCollapsed: function(options) {
      options = options || { };

      var $items = this.$el;

      var group = this.group;
      var groupDevices = group.deviceList();

      /* toggle the collapsed state */
      var collapse = (options.collapse !== undefined) ?
        options.collapse : !this.collapsed;

      var animate = (options.animate !== false) && this.height;

      /* if animations are enabled, start it now */
      if (animate && autom8.Config.display.animations.collapse) {
        var duration = Math.min(
          MAX_TOTAL_EXPAND_DURATION,
          groupDevices.length * EXPAND_DURATION_PER_ITEM);

        var easing = collapse ?
          autom8.Config.display.animations.collapseEasing :
          autom8.Config.display.animations.expandEasing;

        var self = this;

        var animateToHeight = function(height) {
          autom8.Animation.css($items, "toggle-group-" + group.name, {
            duration: duration,
            property: 'height',
            easing: easing,

            onBeforeStarted: function() {
              $items.show();
            },

            onAfterStarted: function() {
              $items.css("height", height || 0);
            },

            onAfterCompleted: function(canceled) {
              if (!canceled) {
                setFinalCollapsedState(self, collapse);
              }
            }
          });
        };

        animateToHeight(collapse ? 0 : this.height);
      }
      /* no animation, just toggle visibility */
      else {
        setFinalCollapsedState(this, collapse);
      }

      this.collapsed = collapse;
    }
  });
}());
