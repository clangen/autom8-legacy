namespace("autom8.controller").DeviceListController = (function() {
  var View = autom8.mvc.View;

  function onLampOrApplianceRowClicked(device) {
    var address = device.get('address');

    if (device.get('status') === autom8.DeviceStatus.On) {
      autom8.util.Device.setDeviceStatus(address, autom8.DeviceStatus.Off);
    }
    else {
      autom8.util.Device.setDeviceStatus(address, autom8.DeviceStatus.On);
    }
  }

  function onSecuritySensorRowClicked(device) {
    var address = device.get('address');
    var tripped = device.tripped();
    var armed = device.armed();
    var on = device.on();

    if (on && tripped) {
      autom8.util.Device.confirmResetSecuritySensor(address);
    }
    else if (armed) {
      autom8.util.Device.confirmDisarmSecuritySensor(address);
    }
    else {
      autom8.util.Device.setSecuritySensorArmed(address, true);
    }
  }

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

      this.views = {
        flat: new autom8.view.DeviceListView(),
        grouped: new autom8.view.GroupedDeviceListView()
      };

      var defaultView = localStorage['autom8.lastDevicesView'] || 'grouped';
      this.setDeviceListView(this.views[defaultView], {bindEvents: false});
    },

    onResume: function() {
      this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.on('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.on('requestReceived', this.onRequestReceived, this);
      autom8.client.on('responseReceived', this.onResponseReceived, this);
      this.refresh();
    },

    onPause: function() {
      this.listView.off('devicerow:clicked', this.onDeviceRowClicked, this);
      this.listView.off('grouprow:clicked', this.onGroupRowClicked, this);
      this.view.off('switchview:clicked', this.onSwitchViewClicked, this);
      autom8.client.off('requestReceived', this.onRequestReceived, this);
      autom8.client.off('responseReceived', this.onResponseReceived, this);
    },

    onDeviceRowClicked: function(device) {
      switch (device.get('type')) {
        case autom8.DeviceType.Lamp:
        case autom8.DeviceType.Appliance:
          onLampOrApplianceRowClicked(device);
          break;

        case autom8.DeviceType.SecuritySensor:
          onSecuritySensorRowClicked(device);
          break;
      }
    },

    onGroupRowClicked: function(group) {
      /* accumulate state */
      var onCount = 0;
      _.each(group.devices, function(device) {
        if (device.get('status') == autom8.DeviceStatus.On) {
          onCount++;
        }
      });
      var allOn = (onCount === group.devices.length);
      var someOn = !!allOn && !!onCount;

      var setAll = function(status) {
        _.each(group.devices, function(device) {
          if (device.get('status') == status) {
            return;
          }

          var isSensor = device.get('type') == autom8.DeviceType.SecuritySensor;
          if (isSensor) {
            return;
          }

          var addr = device.get('address');
          autom8.util.Device.setDeviceStatus(addr, status);
        });
      };

      /* act on state */
      if (onCount === 0) {
        setAll(autom8.DeviceStatus.On);
      }
      else if (allOn) {
        setAll(autom8.DeviceStatus.Off);
      }
      else {
        autom8.util.Device.confirmOnOrOffForPartialGroup(
          group,
          function() { /* all on */
            setAll(autom8.DeviceStatus.On);
          },
          function() { /* all off */
            setAll(autom8.DeviceStatus.Off);
          });
      }
    },

    setDeviceListView: function(newView, options) {
      if (this.listView === newView) {
        return;
      }

      if (this.listView) {
        this.view.removeChild(this.listView);
        this.listView.off(null, null, this);
      }

      var grouped = newView === this.views.grouped;

      /* FIXME: should not have view logic here */
      var caption = "switch to grouped view <b>&gt;</b>";
      if (grouped) {
        caption = "switch to flat view <b>&gt;</b>";
      }

      this.view.$('.switch-devices-view').html(caption);
      /* FIXME: end */

      try {
        localStorage['autom8.lastDevicesView'] = grouped ? 'grouped' : 'flat';
      }
      catch (e) {
        console.log('local storage write failed');
      }

      this.listView = newView;
      this.view.addChild(this.listView);
      this.refresh();

      options = options || { };
      if (options.bindEvents !== false) {
        this.listView.on('devicerow:clicked', this.onDeviceRowClicked, this);
        this.listView.on('grouprow:clicked', this.onGroupRowClicked, this);
      }
    },

    onSwitchViewClicked: function() {
      if (this.listView === this.views.flat) {
        this.setDeviceListView(this.views.grouped);
      }
      else {
        this.setDeviceListView(this.views.flat);
      }
    },

    refresh: function() {
      this.listView.setState("loading");
      autom8.util.Device.getDeviceList();
    },

    onRequestReceived: function(uri, body) {
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
