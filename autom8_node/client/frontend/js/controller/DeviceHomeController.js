namespace("autom8.controller").DeviceHomeController = (function() {
  var View = autom8.mvc.View;

  var Controller = autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.DeviceHomeView();
      this.view.on('devicelistview:switched', this.onDeviceListViewSwitched, this);
      this.refreshDeviceList();
    },

    bindDeviceListViewEvents: function(listView, options) {
      var fn = (options && options.unbind ? "off" : "on");

      if (listView) {
        listView[fn]('devicerow:clicked', this.onDeviceRowClicked, this);
        listView[fn]('grouprow:clicked', this.onGroupRowClicked, this);
        listView[fn]('extras:clicked', this.onDeviceExtrasClicked, this);
      }
    },

    onDeviceListViewSwitched: function(oldListView, newListView) {
      this.bindDeviceListViewEvents(oldListView, {unbind: true});
      this.bindDeviceListViewEvents(newListView);
    },

    onResume: function() {
      this.bindDeviceListViewEvents(this.view.activeDeviceListView);
      this.view.on('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.on('responseReceived', this.onResponseReceived, this);

      this.refreshDeviceList();
    },

    onPause: function() {
      this.bindDeviceListViewEvents(this.view.activeDeviceListView, {unbind: true});
      this.view.off('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.off('responseReceived', this.onResponseReceived, this);
    },

    onDeviceRowClicked: function(device) {
      autom8.util.Device.toggleDeviceStatus(device);
    },

    onGroupRowClicked: function(group) {
      autom8.util.Device.toggleDeviceGroupStatus(group);
    },

    onDeviceExtrasClicked: function(device) {
      if (device.get('type') === autom8.DeviceType.Lamp) {
        autom8.view.BrightnessView.showDialogForLamp(device);
      }
    },

    refreshDeviceList: function() {
      this.view.setState('loading');
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
          this.onDeviceUpdatedResponse(uri, body);
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
      this.view.setDeviceList(this.deviceList);
    },

    onDeviceUpdatedResponse: function(uri, body) {
      var address = body.address;
      var sensorEvent = (uri === "autom8://response/sensor_status_changed");

      this.deviceList.find(_.bind(function(device) {
        if (device.get('address') === address) {
          var resort = false;

          /* we need to resort if we had a sensor that changed tripped status */
          if (sensorEvent) {
            var isTripped = !!body.attributes.tripped;
            var wasTripped = !!device.isTripped();
            if (isTripped !== wasTripped) {
              resort = true;
            }
          }

          /* update the device; leaf views will redraw automatically */
          device.set({
            'attrs': body.attributes,
            'status': body.status,
            'updating': false
          });

          /* a full re-sort/render pass is very heavy weight, so we only
          do it if we know the sort order may have updated; right now that
          only happens when a sensor is tripped */
          if (resort) {
            this.view.resort();

            /* jump the user to the top of the document -- that's where security
            alerts will show up. */
            _.defer(function() {
              $('body').scrollTop(0);
            });
          }

          return true;
        }

        return false;
      }, this));
    }
  });

  return Controller;
}());
