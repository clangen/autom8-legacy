autom8.Controller.DeviceListController = (function() {
  /*
   * the current device list
   */
  var deviceList;

  /* view templates */
  var newGenericDeviceRow =
    Handlebars.compile($("#autom8-View-DeviceRow").html());

  var newDeviceList =
    Handlebars.compile($("#autom8-View-DeviceList").html());

  /* document ready handling */
  $(document).ready(function() {
    var settings = $('#settings');
    if (autom8Client.isNode) {
      settings.hide();
    }
    else {
      settings.click(function() {
        window.location = "settings.html";
      });
    }

    $('#connectButton').click(function() {
      autom8.Controller.DeviceListController.reconnect();
    });

    $('#signout').click(function() {
        $.ajax({
        url: 'signout.action',
        type: 'POST',
        success: function(data) {
          window.location = "/";
        },
        error: function (xhr, status, error) {
        }
      });
    });

    $('#error').hide();
  });

  function onConnected() {
    $('#status').html('connected<span style="font-size: 85%;"> @</span>');
    $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);
    $('#error').hide();
    autom8.Util.getDeviceList();
  }

  function onDisconnected(reason) {
    $('#status').html("not connected");
    $('#devices').html("");
    $('#error').show();
    $('#errorText').html(getDisconnectMessage(reason));
  }

  function onRequestReceived(uri, body) {
    //alert(uri);
  }

  function onResponseReceived(uri, body) {
    body = JSON.parse(body);

    if (uri === "autom8://response/get_device_list")
    {
      onGetDeviceListResponse(body);
    }
    else if ((uri === "autom8://response/device_status_updated") ||
             (uri === "autom8://response/sensor_status_changed"))
    {
      onDeviceUpdatedResponse(body);
    }
  }

  function onGetDeviceListResponse(body) {
    deviceList = body.devices;

    /* unfortunate: backbone model has a property name attributes */
    _.each(deviceList, function(device) {
      device.attrs = device.attributes;
      delete device.attributes;
    });

    var options = {
      comparator: function(device) {
        var address = device.get('address');
        var tripped = autom8.Util.deviceIsTrippedSensor(device);
        return (tripped ? "0-" : "1-") + address;
      }
    }

    deviceList = new autom8.Model.DeviceList(deviceList, options);

    redrawDeviceList();
  };

  function onDeviceUpdatedResponse(body) {
    var address = body.address;

    deviceList.find(function(device) {
      if (device.get('address') === address) {
        device.set({'attrs': body.attributes});
        device.set({'status': body.status});
        deviceList.sort();
        redrawDeviceList();
        return true;
      }

      return false;
    });
  }

  function getDisconnectMessage(reason) {
    switch(reason) {
      case 1: return "Could not connect to server"; break;
      case 2: return "SSL handshake failed"; break;
      case 3: return "Invalid username or password"; break;
      case 4: return "Server sent an invalid message"; break;
      case 5: return "Disconnected (read failed)"; break;
      case 6: return "Disconnected (write failed)"; break;
      default: return "Unknown error"; break;
    }
  }

  function renderLampOrApplianceRow(device) {
    var address = device.get('address');

    var view = {
      rowClass: "",
      buttonClass: "",
      buttonText: "",
      text: device.get('label'),
      subtext: "",
      action: ""
    };

    var turnOn = "autom8.Util.setDeviceStatus('" + address + "', autom8.DeviceStatus.On)";
    var turnOff = "autom8.Util.setDeviceStatus('" + address + "', autom8.DeviceStatus.Off)";

    if (device.get('type') == autom8.DeviceType.Lamp) {
      view.subtext = "lamp module " + address;
    }
    else {
      view.subtext = "appliance module " + address;
    }

    if (device.get('status') == autom8.DeviceStatus.On) {
      view.buttonClass = "button on";
      view.buttonText = "on";
      view.rowClass = "row on";
      view.action = turnOff;
    }
    else {
      view.buttonClass = "button off";
      view.buttonText = "off";
      view.rowClass = "row off";
      view.action = turnOn;
    }

    return newGenericDeviceRow(view);
  }

  function renderSecuritySensorRow (device) {
    var address = device.address();
    var tripped = device.tripped();
    var armed = device.armed();
    var on = device.on();

    var view = {
      action: "",
      rowClass: "row off",
      buttonText: "",
      buttonClass: "",
      text: device.get('label'),
      subtext: "security sensor " + address
    };

    if (on && tripped) {
      view.buttonClass = "button alert";
      view.buttonText = "alert";
      view.rowClass = "row alert";
      view.action = "autom8.Util.confirmResetSecuritySensor('" + address + "')";
    }
    else if (armed) {
      view.buttonClass = "button on";
      view.rowClass = "row on";
      view.buttonText = "armed";
      view.action = "autom8.Util.confirmDisarmSecuritySensor('" + address + "')";
    }
    else {
      view.buttonClass = "button off";
      view.buttonText = "off";
      view.action = "autom8.Util.setSecuritySensorArmed('" + address + "', true)";
    }

    return newGenericDeviceRow(view);
  }

  function renderDevice(device) {
    switch (device.get('type')) {
    case autom8.DeviceType.Lamp:
    case autom8.DeviceType.Appliance:
      return renderLampOrApplianceRow(device);

    case autom8.DeviceType.SecuritySensor:
      return renderSecuritySensorRow(device);

    default:
      alert('unknown device type! ' + device.get('type'));
    }

    return "";
  }

  function redrawDeviceList() {
    if (( ! deviceList) || (_.size(deviceList) < 1)) {
      $('#devices').html("");
      return;
    }

    /*
     * each item in the container, rendered once at a time and
     * contat'd together
     */
    var listHtml = "";
    deviceList.each(function(device) {
      listHtml += renderDevice(device);
    });

    /*
     * nest the devices inside the container. gotta use SafeString
     * on the inner html or else it will be rendered as a string,
     * and not html.
     */
    $('#devices').html(newDeviceList({
      list: new Handlebars.SafeString(listHtml)
    }));
  }

  /*
   * public api
   */
  return {
    init: function() {
      autom8Client.connected.connect(onConnected);
      autom8Client.disconnected.connect(onDisconnected);
      autom8Client.requestReceived.connect(onRequestReceived);
      autom8Client.responseReceived.connect(onResponseReceived);

      var ls = localStorage;
      var prefs = autom8.Prefs;
      var dirty = ls[prefs.ConnectionDirty];
      var configured = autom8Client.isNode || autom8.Prefs.hasConfiguredConnection();
      var connected = autom8Client.isConnected();

      if (dirty || (configured && !connected)) {
        this.reconnect();
      }
      else if ( ! configured) {
        window.location = "settings.html";
      }
      else if (connected) {
        onConnected();
      }
    },

    reconnect: function() {
      $('#status').html("connecting...");
      $('#hostname').html("");
      $('#error').hide();

      var ls = localStorage;
      var prefs = autom8.Prefs;

      autom8Client.connect(
        ls[prefs.ConnectionHost],
        ls[prefs.ConnectionPort],
        ls[prefs.ConnectionPw]);
    }
  }
}()); // autom8.Controller.DeviceListController
