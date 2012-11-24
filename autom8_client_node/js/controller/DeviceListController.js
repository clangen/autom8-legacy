namespace("autom8.controller").DeviceListController = (function() {
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
      this.view = new autom8.view.DeviceListView();

      this.view.on('devicerow:clicked', this.onDeviceRowClicked, this);
      this.view.on('signin:clicked', this.reconnect, this);

      autom8.client.on('connected', _.bind(this.onConnected, this));
      autom8.client.on('disconnected', _.bind(this.onDisconnected, this));
      autom8.client.on('requestReceived', _.bind(this.onRequestReceived, this));
      autom8.client.on('responseReceived', _.bind(this.onResponseReceived, this));

      var connected = autom8.client.isConnected();

      if (!connected) {
        this.reconnect();
      }
      else {
        onConnected();
      }
    },

    reconnect: function() {
      this.view.setState("loading");
      autom8.client.connect();
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

    onConnected: function() {
      this.view.setState("loading");
      autom8.util.Device.getDeviceList();
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
          var tripped = autom8.util.Device.deviceIsTrippedSensor(device);
          return (tripped ? "0-" : "1-") + address;
        }
      };

      this.deviceList = new autom8.model.DeviceList(devices, options);
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
}());
