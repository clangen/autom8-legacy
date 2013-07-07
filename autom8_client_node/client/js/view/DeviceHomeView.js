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
      this.listViewContainer = this.addChild(new autom8.mvc.View({
        className: 'device-list-view-container'
      }));

      /* add the children to the view container. both are here, but only
      one will ever be displayed at a time. start with both paused, we'll
      resume the appropriate one */
      this.listViewContainer.addChild(this.lists.flat, {resume: false});
      this.listViewContainer.addChild(this.lists.grouped, {resume: false});
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
      var $container = this.listViewContainer.$el;

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
      }

      /* if there was no previous view we don't need to animate, just
      show/enable it and return */
      if (!oldView) {
        newView.$el.addClass('active');
        newView.resume();
      }
      /* otherwise, one of the views is visible, so we need to animate
      it out of the scene, and animate the new view in */
      else {
        /* to complete the animation successfully we need to have
        both views visible immediately before the animation begins.
        also, make sure both views know they're animating */
        _.each(this.lists.all, function(view) {
          view.$el.addClass('animating');
          view.$el.addClass('active');
        });

        $container.addClass(grouped ? '' : 'left');

        /* start the animation */
        this.animating = true;

        autom8.Animation.css($container, "devices-switch-view", {
          hwAccel: false,
          duration: autom8.Config.display.animations.viewSwitchDuration,
          easing: autom8.Config.display.animations.viewSwitchEasing,

          onAfterStarted: function() {
            $container.toggleClass('left');
            newView.resume();
          },

          onAfterCompleted: _.bind(function(canceled) {
            if (!canceled) {
              this.animating = false;

              /* animation completed successfully, deactivate all of the
              non-visible views and removing the animating flag so views
              that are no longer visible are not rendered in the DOM */
              _.each(this.lists.all, function(view) {
                if (view !== newView) {
                  view.$el.removeClass('active');
                  view.pause();
                }

                view.$el.removeClass('animating');
              });

              /* reset the viewport, as now there should only be the active
              view visible */
              $container.removeClass('left');
            }
          }, this)
        });
      }
    }
  });
}());