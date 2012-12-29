namespace("autom8.view").SwitcherView = (function() {
  var stateToHtmlMap = {
    flat: "switch to area view <b>&gt;</b>",
    grouped: "<b>&lt;</b> switch to flat view"
  };

  var View = autom8.mvc.View;

  return View.extend({
    className: "switch-devices-view",

    onCreate: function(options) {
      options = options || { };
      this.$label = $('<span class="switch-label"></span>');
      this.$el.append(this.$label);
      this.setState(localStorage['autom8.lastDevicesView'] || 'grouped', false);
    },
    
    getState: function() {
      return this.state;
    },

    setState: function(state, animate) {
      if (this.state === state) {
        return;
      }

      this.state = state;

      /* set initial state. if our new state is grouped, that means
      the animation is going from left to right, so start on the
      left */
      var from = (state === "grouped") ? "right" : "left";
      var to = (from === "left") ? "right" : "left";

      if (animate === false || !autom8.Config.display.animations.viewSwitcher) {
        this.$label.removeClass(from).addClass(to);
        this.$label.html(stateToHtmlMap[state]);
      }
      else {
        var keyframes = (from === "left") ? "left-to-right" : "right-to-left";

        this.$label.addClass(from);
        autom8.Animation.css(this.$label, "devices-switcher-view", {
          duration: autom8.Config.display.animations.viewSwitcherDuration,
          easing: autom8.Config.display.animations.viewSwitcherEasing,
          keyframes: keyframes,
          onAfterStarted: _.bind(function() {
            /* once the animation has started we toggle the final
            class. if we wait until we do this at the end, we may
            see a little bit of flicker. the animation also appears
            less jerky if we set the text after the animation starts */
            this.$label.html(stateToHtmlMap[state]);
            this.$label.removeClass(from).addClass(to);
          }, this)
        });
      }

      try {
        localStorage['autom8.lastDevicesView'] = state;
      }
      catch (e) {
        console.log('local storage write failed');
      }
    }
  });
}());
