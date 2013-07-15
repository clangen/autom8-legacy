namespace("autom8.view").SwitcherView = (function() {
  var Browser = namespace('autom8').Browser;

  var stateToHtmlMap = {
    flat: "show areas",
    grouped: "show all"
  };

  function getLabelOffset(context, pos) {
    var $parent = context.$el;
    var $container = context.$container;

    var parentWidth = $parent.width();
    var containerWidth = $container.width();
    var offset = (parentWidth - containerWidth);

    return (pos === "left") ? -offset : offset;
  }

  function updateLabelOffsetWithoutTransform(context, pos) {
    Browser.setPrefixedStyle(context.$container, 'transform', 'none');
    context.$el.css('text-align', pos);
  }

  function updateLabelOffset(context, pos) {
    var xOffset = String(getLabelOffset(context, pos)) + 'px';
    Browser.setPrefixedStyle(context.$container, 'transform', 'translate3d(' + xOffset + ', 0, 0)');
  }

  function getCurrentPosition(context) {
    return (context.state === "grouped") ? "left" : "right";
  }

  var View = autom8.mvc.View;

  return View.extend({
    className: "switch-devices-view",

    onCreate: function(options) {
      options = options || { };

      this.setElement(View.elementFromTemplateId('autom8-View-SwitcherView'));

      this.$label = this.$('.switcher-label');
      this.$container = this.$('.switcher-container');
      this.$leftButton = this.$('.switcher-button.left');
      this.$rightButton = this.$('.switcher-button.right');

      this.setState(localStorage['autom8.lastDevicesView'] || 'grouped', false);
      this.onResized = _.bind(_.debounce(this.onResized, 100), this);

      $(window).on('resize', this.onResized);
    },

    onDestroy: function(options) {
      $(window).off('resize', this.onResized);
    },

    onResized: function(event) {
      updateLabelOffsetWithoutTransform(this, getCurrentPosition(this));
    },

    renderLabel: function(animate) {
      this.$label.html(stateToHtmlMap[this.state]);

      /* wait for the next pass through the event loop to start the animation;
      we need to make sure the label updates first so the size can be properly
      calculated. alternatively we could wait until the animation is done to
      tweak the label value, but it looks a bit glitchy */
      _.defer(_.bind(function() {
        var inDom = (this.$el.closest(document.documentElement).length > 0);
        var to = getCurrentPosition(this); /* note: new state already set! */
        var from = (to === "left") ? "right" : "left";

        if (to === 'left') {
          this.$rightButton.addClass('hidden');
          this.$leftButton.removeClass('hidden');
        }
        else {
          this.$leftButton.addClass('hidden');
          this.$rightButton.removeClass('hidden');
        }

        if (!inDom) {
          updateLabelOffsetWithoutTransform(this, to);
        }
        else {
          if (animate === false || !autom8.Config.display.animations.viewSwitcher) {
            updateLabelOffsetWithoutTransform(this, getCurrentPosition(this));
          }
          else {
            autom8.Animation.css(this.$container, "devices-switcher-view", {
              duration: autom8.Config.display.animations.viewSwitcherDuration,
              easing: autom8.Config.display.animations.viewSwitcherEasing,

              onStarted: _.bind(function() {
                updateLabelOffset(this, to);
              }, this),

              onAfterCompleted: _.bind(function() {
                /* it's in its final position, align text and remove
                the transformation */
                updateLabelOffsetWithoutTransform(this, to);
              }, this)
            });
          }
        }
      }, this));
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
