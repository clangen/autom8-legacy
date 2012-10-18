autom8.Util = {
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
      icon: autom8.Util.Dialog.Icon.Question,
      buttons: [
        {
          caption: "Yes",
          callback: function() {
            autom8.Uti.resetSecuritySensor(deviceAddress);
          }
        },
        {
          caption: "No",
          callback: null,
          cancel: true
        }
      ]
    };

    autom8.Util.Dialog.show(dialog);
  },

  confirmDisarmSecuritySensor: function(deviceAddress) {
    var dialog = {
      title: "Confirm disarm",
      message: "Are you sure you want to disarm this security sensor?",
      icon: autom8.Util.Dialog.Icon.Question,
      buttons: [
        {
          caption: "Yes",
          callback: function() {
            autom8.Util.setSecuritySensorArmed(deviceAddress, false);
          }
        },
        {
          caption: "No",
          callback: null,
          cancel: true
        }
      ]
    };

    autom8.Util.Dialog.show(dialog);
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