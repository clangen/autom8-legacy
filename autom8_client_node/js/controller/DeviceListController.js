namespace("autom8.controller").DeviceListController = (function() {
  var View = autom8.mvc.View;

  var Controller = autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.mvc.View({
        el: View.elementFromTemplateId('autom8-View-DevicesView'),
        events: {
          "touch .switch-devices-view": function(e) {
            this.trigger('switchview:clicked');
          }
        }
      });

      /* view user uses to initialize view switch */
      this.switcherView = this.view.addChild(new autom8.view.SwitcherView());

      /* views the user can switch between */
      this.views = {
        flat: new autom8.view.DeviceListView({className: 'panel'}),
        grouped: new autom8.view.GroupedDeviceListView({className: 'panel'})
      };

      this.views.all = _.values(this.views);

      /* container is used to host the transition animation between
      grouped and area modes */
      this.listViewContainer = this.view.addChild(new autom8.mvc.View({
        className: 'device-list-view-container'
      }));

      /* add the children to the view container, but don't actually add
      them to the DOM; setDeviceListView will take care of adding them
      to the DOM and animating them into place */
      this.listViewContainer.addChild(this.views.flat);
      this.listViewContainer.addChild(this.views.grouped);

      /* set the initial view, but don't bind the events. the events
      will be bound when the controller is resumed */
      this.setDeviceListView(this.views[this.switcherView.getState()], {bindEvents: false});
    },

    onResume: function() {
      this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.on('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.on('responseReceived', this.onResponseReceived, this);
      this.refresh();
    },

    onPause: function() {
      this.listView.off('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.off('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.off('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.off('responseReceived', this.onResponseReceived, this);
    },

    onDeviceRowClicked: function(device) {
      autom8.util.Device.toggleDeviceStatus(device);
    },

    onGroupRowClicked: function(group) {
      autom8.util.Device.toggleDeviceGroupStatus(group);
    },

    startTransition: function(listView, newView) {
      var $container = this.listViewContainer.$el;
      var grouped = (newView === this.views.grouped);

      /* if there was no previous view we don't need to animate, just
      show/enable it and return */
      if (!this.listView) {
        newView.$el.addClass('active');
        this.switcherView.setState(grouped ? "grouped" : "flat");
      }
      /* otherwise, one of the views is visible, so we need to animate
      it out of the scene, and animate the new view in */
      else {
        /* to complete the animation successfully we need to have
        both views visible immediately before the animation begins */
        this.views.grouped.$el.addClass('active');
        this.views.flat.$el.addClass('active');

        /* start the animation */
        this.animating = true;

        autom8.Animation.css($container, "devices-switch-view", {
          hwAccel: false,
          duration: 0.3,
          easing: 'ease-out',
          initialClass: grouped ? '' : 'left',
          toggleClass: 'left',
          onCompleted: _.bind(function(canceled) {
            if (!canceled) {
              this.switcherView.setState(grouped ? "grouped" : "flat");
              this.animating = false;

              /* animation completed successfully, deactivate all of the
              non-visible views */
              _.each(this.views.all, function(view) {
                if (view !== newView) {
                  view.$el.removeClass('active');
                }
              });

              /* reset the viewport, as now there should only be the active
              view visible */
              $container.removeClass('left');
            }
          }, this)
        });
      }
    },

    setDeviceListView: function(newView, options) {
      if (this.listView === newView) {
        return;
      }

      if (this.listView) {
        this.listView.off(null, null, this);
      }

      this.startTransition(this.listView, newView);

      this.listView = newView;

      if (this.deviceList) {
        _.invoke(this.views.all, 'setDeviceList', this.deviceList);
        this.listView.setState("loaded");
      }
      else {
        this.refresh();
      }

      options = options || { };
      if (options.bindEvents !== false) {
        this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
        this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      }
    },

    onSwitchViewClicked: function() {
      if (!this.animating) {
        if (this.listView === this.views.flat) {
          this.setDeviceListView(this.views.grouped);
        }
        else {
          this.setDeviceListView(this.views.flat);
        }
      }
    },

    refresh: function() {
      _.invoke(this.views.all, 'setState', 'loading');
      autom8.util.Device.getDeviceList();
    },

    onResponseReceived: function(uri, body) {
      body = JSON.parse(body);

      switch (uri) {
        case "autom8://response/get_device_list":
          this.onGetDeviceListResponse(body);
          break;

        case "autom8://response/device_status_updated":
        case "autom8://response/sensor_status_changed":
          this.onDeviceUpdatedResponse(body);
          break;
      }
    },

    onGetDeviceListResponse: function(body) {
      var devices = body.devices;
      
      /* unfortunate: backbone model has a property name attributes */
      _.each(devices, function(device) {
        device.attrs = device.attributes;
        delete device.attributes;
      });

      var options = {
        comparator: function(device) {
          var address = device.get('address');
          var tripped = autom8.util.Device.deviceIsTrippedSensor(device);
          return (tripped ? "0-" : "1-") + address;
        }
      };

      this.deviceList = new autom8.model.DeviceList(devices, options);
      this.listView.setDeviceList(this.deviceList);
      this.listView.setState("loaded");
    },

    onDeviceUpdatedResponse: function(body) {
      var address = body.address;

      this.deviceList.find(_.bind(function(device) {
        if (device.get('address') === address) {
          device.set({'attrs': body.attributes});
          device.set({'status': body.status});
          this.deviceList.sort();
          this.listView.render();
          return true;
        }

        return false;
      }, this));
    }
  });

  return Controller;
}());
