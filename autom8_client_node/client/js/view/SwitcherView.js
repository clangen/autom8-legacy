namespace("autom8.view").SwitcherView = (function() {
  var stateToHtmlMap = {
    flat: "switch to area view <b>&gt;</b>",
    grouped: "<b>&lt;</b> switch to flat view"
  };

  function getLabelOffset(context, pos) {
    var $container = context.$el;
    var $label = this.$('.switch-label');

    if (!pos || pos === "left") {
      return 0;
    }
    else {
      var containerWidth = $container.width();
      var labelWidth = $label.width();
      return (containerWidth - labelWidth);
    }
  }

  function updateLabelOffset(context, pos) {
    var xOffset = String(getLabelOffset(context, pos)) + 'px';

    context.$label.css({
      '-webkit-transform': 'translate3d(' + xOffset + ', 0, 0)'
    });
  }

  function getCurrentPosition(context) {
    return (context.state === "grouped") ? "left" : "right";
  }

  var View = autom8.mvc.View;

  return View.extend({
    className: "switch-devices-view",

    onCreate: function(options) {
      options = options || { };
      this.$label = $('<div class="switch-label"></div>');
      this.$el.append(this.$label);
      this.setState(localStorage['autom8.lastDevicesView'] || 'grouped', false);
      this.onResized = _.bind(_.debounce(this.onResized, 100), this);

      $(window).on('resize', this.onResized);
    },

    onDestroy: function(options) {
      $(window).off('resize', this.onResized);
    },

    onResized: function(event) {
      updateLabelOffset(this, getCurrentPosition(this));
    },

    renderLabel: function(animate) {
      this.$label.html(stateToHtmlMap[this.state]);

      /* set initial state. if our new state is grouped, that means
      the animation is going from left to right, so start on the
      left */
      var to = getCurrentPosition(this); /* note: new state already set! */
      var from = (to === "left") ? "right" : "left";

      var inDom = (this.$el.closest(document.documentElement).length > 0);

      if (!inDom) {
        if (to === "right") {
          this.$el.css({'text-align': 'right'});
        }
      }
      else {
        this.$el.css({'text-align': 'left'});

        if (animate === false || !autom8.Config.display.animations.viewSwitcher) {
          updateLabelOffset(this, getCurrentPosition(this));
        }
        else {
          updateLabelOffset(this, from); /* set initial position */

          autom8.Animation.css(this.$label, "devices-switcher-view", {
            duration: autom8.Config.display.animations.viewSwitcherDuration,
            easing: autom8.Config.display.animations.viewSwitcherEasing,

            onPrepared: _.bind(function() {
              updateLabelOffset(this, to);
            }, this),

            onAfterCompleted: _.bind(function() {
              updateLabelOffset(this, to);
            }, this)
          });
        }
      }
    },

    getState: function() {
      return this.state;
    },

    setState: function(state, animate) {
      if (this.state === state) {
        return;
      }

      this.state = state;
      this.renderLabel(animate);

      try {
        localStorage['autom8.lastDevicesView'] = state;
      }
      catch (e) {
        console.log('local storage write failed');
      }
    }
  });
}());
