autom8.Controller.DeviceListController = (function() {
  function onLampOrApplianceRowClicked(device) {
    var address = device.get('address');

    if (device.get('status') === autom8.DeviceStatus.On) {
      autom8.Util.setDeviceStatus(address, autom8.DeviceStatus.Off);
    }
    else {
      autom8.Util.setDeviceStatus(address, autom8.DeviceStatus.On);
    }
  }

  function onSecuritySensorRowClicked(device) {
    var address = device.get('address');
    var tripped = device.tripped();
    var armed = device.armed();
    var on = device.on();

    if (on && tripped) {
      autom8.Util.confirmResetSecuritySensor(address);
    }
    else if (armed) {
      autom8.Util.confirmDisarmSecuritySensor(address);
    }
    else {
      autom8.Util.setSecuritySensorArmed(address, true);
    }
  }

  /*
   * public api
   */
  var Controller = autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.View.DeviceListView({el: $('#main-content')});

      this.view.on('devicerow:clicked', this.onDeviceRowClicked, this);
      this.view.on('signout:clicked', this.onSignOutClicked, this);
      this.view.on('signin:clicked', this.reconnect, this);

      autom8Client.connected.connect(_.bind(this.onConnected, this));
      autom8Client.disconnected.connect(_.bind(this.onDisconnected, this));
      autom8Client.requestReceived.connect(_.bind(this.onRequestReceived, this));
      autom8Client.responseReceived.connect(_.bind(this.onResponseReceived, this));

      var ls = localStorage;
      var prefs = autom8.Prefs;
      var dirty = ls[prefs.ConnectionDirty];
      var connected = autom8Client.isConnected();

      if (dirty || !connected) {
        this.reconnect();
      }
      else if (connected) {
        onConnected();
      }
    },

    reconnect: function() {
      this.view.setState("loading");

      var ls = localStorage;
      var prefs = autom8.Prefs;

      autom8Client.connect(
        ls[prefs.ConnectionHost],
        ls[prefs.ConnectionPort],
        ls[prefs.ConnectionPw]);
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

    onSignOutClicked: function() {
      $.ajax({
        url: 'signout.action',
        type: 'POST',
        success: function(data) {
          window.location = "/";
        },
        error: function (xhr, status, error) {
      }});
    },

    onConnected: function() {
      this.view.setState("loading");
      autom8.Util.getDeviceList();
    },

    onDisconnected: function(reason) {
      this.view.setState("disconnected", {
        errorCode: reason
      });
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
          var tripped = autom8.Util.deviceIsTrippedSensor(device);
          return (tripped ? "0-" : "1-") + address;
        }
      };

      this.deviceList = new autom8.Model.DeviceList(devices, options);
      this.view.setDeviceList(this.deviceList);
      this.view.setState("loaded");
    },

    onDeviceUpdatedResponse: function(body) {
      var address = body.address;

      this.deviceList.find(_.bind(function(device) {
        if (device.get('address') === address) {
          device.set({'attrs': body.attributes});
          device.set({'status': body.status});
          this.deviceList.sort();
          this.view.setDeviceList(this.deviceList);
          return true;
        }

        return false;
      }, this));
    }
  });

  return Controller;
}()); // autom8.Controller.DeviceListController
