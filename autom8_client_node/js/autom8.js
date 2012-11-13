namespace("autom8").DeviceType = {
  Unknown: -1,
  Lamp: 0,
  Appliance: 1,
  SecuritySensor: 2
};

namespace("autom8").CommandType = {
  PowerLine: 0,
  RadioFrequency: 1
};

namespace("autom8").DeviceStatus = {
  Unknown: 1,
  Off: 0,
  On: 1
};

namespace("autom8").Prefs = {
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