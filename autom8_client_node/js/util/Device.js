namespace("autom8.util").Device = {
  setDeviceStatus: function(deviceAddress, newStatus) {
    var body = {
      command: {
        name: "set_status",
        type: autom8.CommandType.PowerLine,
        address: deviceAddress,
        parameters: {
          status: newStatus
        }
      }
    };

    autom8.client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
  },

  toggleLampOrApplianceStatus: function(device) {
    var address = device.get('address');

    if (device.get('status') === autom8.DeviceStatus.On) {
      autom8.util.Device.setDeviceStatus(address, autom8.DeviceStatus.Off);
    }
    else {
      autom8.util.Device.setDeviceStatus(address, autom8.DeviceStatus.On);
    }
  },

  toggleSecuritySensorStatus: function(device) {
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
  },

  toggleDeviceStatus: function(device) {
    switch (device.get('type')) {
      case autom8.DeviceType.Lamp:
      case autom8.DeviceType.Appliance:
        this.toggleLampOrApplianceStatus(device);
        break;

      case autom8.DeviceType.SecuritySensor:
        this.toggleSecuritySensorStatus(device);
        break;
    }
  },

  toggleDeviceGroupStatus: function(group) {
    var stats = this.getDeviceListStats(group.devices);

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
    if (stats.onCount === 0) {
      setAll(autom8.DeviceStatus.On);
    }
    else if (stats.allOn) {
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

  resetSecuritySensor: function(deviceAddress) {
    var body = {
      command: {
        name: "reset_sensor_status",
        type: autom8.CommandType.PowerLine,
        address: deviceAddress,
        parameters: {
        }
      }
    };

    autom8.client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
  },

  confirmOnOrOffForPartialGroup: function(group, onCallback, offCallback) {
    var dialog = {
      title: "On or off?",
      message: "This group has some devices on, and some off. What would you like to do?",
      icon: autom8.util.Dialog.Icon.Question,
      buttons: [
        {
          caption: "turn all on",
          callback: onCallback,
          positive: true
        },
        {
          caption: "turn all off",
          callback: offCallback
        }
      ]
    };

    autom8.util.Dialog.show(dialog);
  },

  confirmResetSecuritySensor: function(deviceAddress) {
    var dialog = {
      title: "Confirm reset",
      message: "Are you sure you want to reset this security alert?",
      icon: autom8.util.Dialog.Icon.Question,
      buttons: [
        {
          caption: "yes",
          callback: function() {
            autom8.util.Device.resetSecuritySensor(deviceAddress);
          },
          positive: true
        },
        {
          caption: "no",
          callback: null,
          negative: true
        }
      ]
    };

    autom8.util.Dialog.show(dialog);
  },

  confirmDisarmSecuritySensor: function(deviceAddress) {
    var dialog = {
      title: "Confirm disarm",
      message: "Are you sure you want to disarm this security sensor?",
      icon: autom8.util.Dialog.Icon.Question,
      buttons: [
        {
          caption: "yes",
          callback: function() {
            autom8.util.Device.setSecuritySensorArmed(deviceAddress, false);
          },
          positive: true
        },
        {
          caption: "no",
          callback: null,
          negative: true
        }
      ]
    };

    autom8.util.Dialog.show(dialog);
  },

  setSecuritySensorArmed: function(deviceAddress, armed) {
    var body = {
      command: {
        name: "arm_sensor",
        type: autom8.CommandType.PowerLine,
        address: deviceAddress,
        parameters: {
          set_armed: !!armed
        }
      }
    };

    autom8.client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
  },

  getDeviceList: function() {
    autom8.client.send(
      "autom8://request/get_device_list",
      JSON.stringify({ }));
  },

  deviceIsTrippedSensor: function(device) {
    var result =
      (device.get('type') === autom8.DeviceType.SecuritySensor) &&
      (device.get('attrs').armed) &&
      (device.get('attrs').tripped);
    
    return result;
  },

  getDeviceListStats: function(devices) {
      var stats = {
        totalCount: devices.length,
        onCount: 0,
        armedCount: 0,
        trippedCount: 0,
        sensorCount: 0,
        lampCount: 0,
        applianceCount: 0,
        allOn: false,
        someOn: false
      };

      _.each(devices, function(device) {
        switch (device.get('type')) {
        case autom8.DeviceType.SecuritySensor:
          stats.sensorCount++;
          
          if (device.tripped()) {
            stats.trippedCount++;
          }

          if (device.armed()) {
            stats.armedCount++;
          }
          break;
        
        case autom8.DeviceType.Lamp:
          stats.lampCount++;
          break;

        case autom8.DeviceType.Appliance:
          stats.applianceCount++;
          break;
        }

        if (device.get('status') == autom8.DeviceStatus.On) {
          stats.onCount++;
        }
      });
      
      stats.allOn = (stats.onCount === devices.length);
      stats.someOn = !stats.allOn && !!stats.onCount;
      stats.allArmed = (stats.sensorCount && stats.sensorCount === stats.armedCount);
      stats.someArmed = (!stats.allArmed && stats.armedCount && stats.sensorCount !== stats.armedCount);
      stats.allTripped = (stats.sensorCount && stats.sensorCount === stats.trippedCount);
      stats.someTripped = (stats.sensorCount && stats.trippedCount && stats.sensorCount !== stats.trippedCount);

      return stats;
  }
};