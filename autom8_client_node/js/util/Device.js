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

    autom8Client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
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

    autom8Client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
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

    autom8Client.send(
      "autom8://request/send_device_command",
      JSON.stringify(body));
  },

  getDeviceList: function() {
    autom8Client.send(
      "autom8://request/get_device_list",
      JSON.stringify({ }));
  },

  deviceIsTrippedSensor: function(device) {
    var result =
      (device.get('type') === autom8.DeviceType.SecuritySensor) &&
      (device.get('attrs').armed) &&
      (device.get('attrs').tripped);
    
    return result;
  }
};