autom8 = { };
autom8.Environment = { };
autom8.Ui = { };

autom8.Environment.init = function() {
  autom8.Ui.Main.init();
}

autom8.DeviceType = {
  Unknown: -1,
  Lamp: 0,
  Appliance: 1,
  SecuritySensor: 2
};

autom8.CommandType = {
  PowerLine: 0,
  RadioFrequency: 1
};

autom8.DeviceStatus = {
  Unknown: 1,
  Off: 0,
  On: 1
};

autom8.Prefs = {
  ConnectionName: "autom8.pref.connection.name",
  ConnectionHost: "autom8.pref.connection.host",
  ConnectionPort: "autom8.pref.connection.port",
  ConnectionPw: "autom8.pref.connection.pw",
  ConnectionDirty: "autom8.pref.connection.dirty",

  hasConfiguredConnection: function() {
    var ls = localStorage;
    var p = autom8.Prefs;

    return ls[p.ConnectionName] && ls[p.ConnectionHost] &&
      ls[p.ConnectionPort] && ls[p.ConnectionPw];
  }
};

autom8.setDeviceStatus = function(deviceAddress, newStatus) {
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
}

autom8.resetSecuritySensor = function(deviceAddress) {
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
}

autom8.setSecuritySensorArmed = function(deviceAddress, armed) {
  var body = {
    command: {
      name: "arm_sensor",
      type: autom8.CommandType.PowerLine,
      address: deviceAddress,
      parameters: {
        set_armed: (armed == true)
      }
    }
  };

  autom8Client.send(
    "autom8://request/send_device_command",
    JSON.stringify(body));
}

autom8.getDeviceList = function() {
  autom8Client.send(
    "autom8://request/get_device_list",
    JSON.stringify({ }));
}

autom8.deviceIsTrippedSensor = function(device) {
  var result =
    (device.type === autom8.DeviceType.SecuritySensor) &&
    (device.attributes.armed) &&
    (device.attributes.tripped);
  
  return result;
}

autom8.deviceSort = function(dev1, dev2) {
  var dev1Tripped = autom8.deviceIsTrippedSensor(dev1);
  var dev2Tripped = autom8.deviceIsTrippedSensor(dev2);

  if (dev1Tripped && dev2Tripped) {
    return (dev1.address > dev2.address) ? 1 : -1;
  }
  else if (dev1Tripped) {
    return -1;
  }
  else if (dev2Tripped) {
    return 1;
  }
  else {
    return (dev1.address > dev2.address) ? 1 : -1;
  }
}