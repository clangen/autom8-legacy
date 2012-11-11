var autom8 = window.autom8 = (window.autom8 || { });
autom8.Model = (autom8.Model || { });
autom8.View = (autom8.View || { });
autom8.Controller = (autom8.Controller || { });

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