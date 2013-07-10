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

    if (collapsed) {
      context.pause();
    }
    else {
      context.resume();
    }
  }

  function getListHeight($el, collapse, callback) {
    if (callback) {
      if (collapse) {
        callback(0);
        return;
      }

      var restore = $el.css(
        ['position', 'visibility', 'height', 'display']);

      $el.css({
        'position': 'absolute',
        'visibility': 'hidden',
        'height': 'auto',
        'display': 'block'
      });

      _.defer(function() {
        var height = $el.height();
        $el.css(restore);
        _.defer(callback, height);
      });
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

    toggleCollapsed: function(options) {
      options = options || { };

      var $items = this.$el;

      var group = this.group;
      var groupDevices = group.deviceList();

      /* toggle the collapsed state */
      var collapse = (options.collapse !== undefined) ?
        options.collapse : !this.collapsed;

      /* remember group collapsed state and set the expander badge.
      this structure will be serialized, then restored on application
      startup */
      storeCollapsedState(group.name(), collapse);

      var animate = options.animate !== false;

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
            easing: 'easing',

            onBeforeStarted: function() {
              $items.show();
            },

            onAfterStarted: function() {
              $items.css("height", height);
            },

            onAfterCompleted: function(canceled) {
              if (!canceled) {
                if (collapse) {
                  $items.hide();
                }

                // self[collapse ? 'pause' : 'resume']();
                // self.collapsed = collapse;
              }
            }
          });
        };

        getListHeight($items, collapse, function(height) {
          console.log((collapse ? "collapse" : "expand") + " height: " + height);
          animateToHeight(height);
        });
      }
      /* no animation, just toggle visibility */
      else {
        $items[collapse ? 'hide' : 'show']();
        $items.css("height", "auto");
        this[collapse ? 'pause' : 'resume']();
      }

      this.collapsed = collapse;
    }
  });
}());
