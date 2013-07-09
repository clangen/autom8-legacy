namespace("autom8.view").DeviceHomeView = (function() {
  var View = autom8.mvc.View;

  return View.extend({
    events: {
      "touch .switch-devices-view": function(e) {
        if (!this.animating) {
          if (this.activeListView === this.lists.flat) {
            this.setDeviceListView(this.lists.grouped);
          }
          else {
            this.setDeviceListView(this.lists.flat);
          }
        }
      }
    },

    onCreate: function(options) {
      this.$el.append(View.elementFromTemplateId('autom8-View-DevicesView'));
      this.switcher = this.addChild(new autom8.view.SwitcherView());

      /* views the user can switch between */
      this.lists = {
        flat: new autom8.view.DeviceListView({className: 'panel'}),
        grouped: new autom8.view.GroupedDeviceListView({className: 'panel right'})
      };

      this.lists.all = _.values(this.lists);

      /* container is used to host the transition animation between
      grouped and area modes */
      var $container = $('<div class="device-home-container"></div>');
      var $viewport = $('<div class="device-home-viewport"></div>');
      $container.append($viewport);

      this.deviceViewContainer = this.addChild(new autom8.mvc.View({
        el: $container
      }));

      /* add the children to the view container. both are here, but only
      one will ever be displayed at a time. start with both paused, we'll
      resume the appropriate one */
      var args = { appendToElement: $viewport };
      this.deviceViewContainer.addChild(this.lists.flat, args);
      this.deviceViewContainer.addChild(this.lists.grouped, args);
    },

    onAfterCreate: function(options) {
      /* set the initial list view */
      this.setDeviceListView(this.lists[this.switcher.getState()]);
    },

    setDeviceList: function(deviceList) {
      if (deviceList) {
        _.invoke(this.lists.all, 'setDeviceList', deviceList);
        _.invoke(this.lists.all, 'setState', 'loaded');
      }
    },

    setState: function(newState) {
        _.invoke(this.lists.all, 'setState', newState);
    },

    resort: function() {
      _.invoke(this.lists.all, 'resort');
    },

    setDeviceListView: function(newView) {
      if (this.activeListView === newView) {
        return;
      }

      var oldView = this.activeListView;
      this.startTransition(oldView, newView);
      this.activeListView = newView;

      this.trigger('devicelistview:switched', oldView, newView);
    },

    startTransition: function(oldView, newView) {
      var $viewport = this.deviceViewContainer.$('.device-home-viewport');

      var grouped = (newView === this.lists.grouped);
      this.switcher.setState(grouped ? "grouped" : "flat");

      /* some platforms can't support animation smoothly (e.g. android).
      for these platforms just toggle visibility and be done with it */
      if (!autom8.Config.display.animations.viewSwitch) {
        _.each(this.lists.all, function(view) {
          if (view !== newView) {
            view.hide();
            view.pause();
          }
        });

        newView.show();
        newView.resume();
        return;
      } /* TODO THIS IS PROBABLY BROKEN NOW */

      /* start the animation */
      this.animating = true;

      var from = (grouped ? 'right' : 'left');
      var to = (from === 'left' ? 'right' : 'left');
      var self = this;

      autom8.Animation.css($viewport, "devices-switch-view", {
        duration: autom8.Config.display.animations.viewSwitchDuration,
        easing: autom8.Config.display.animations.viewSwitchEasing,

        onBeforeStarted: function() {
            $viewport.toggleClass('left', from === "left");
        },

        onAfterStarted: function() {
          $viewport.toggleClass('left', from !== "left");
        },

        onAfterCompleted: _.bind(function(canceled) {
          if (!canceled) {
            this.animating = false;
          }
        }, this)
      });
    }
  });
}());