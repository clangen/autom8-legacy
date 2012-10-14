autom8.Controller.DeviceListController = (function() {
  /*
   * the current device list
   */
  var deviceList;

  /* templates as html strings */
  var deviceListTemplate = $("#autom8-View-DeviceList").html();
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();

  function htmlFromTemplate(template, params) {
    var compiled = Handlebars.compile(template);
    return compiled(params || { });
  }

  function elementFromTemplate(template, params) {
    return $(htmlFromTemplate(template, params));
  }

  /* document ready handling */
  $(document).ready(function() {
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

    autom8.Util.addTouchSupport('#devices', '.device-row');
    autom8.Util.addTouchSupport('#header', '.header-button');
    autom8.Util.addTouchSupport('#error', '.sign-in-button');
  });

  function onConnected() {
    $('#status').html('connected<span style="font-size: 85%;"> @</span>');
    $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);
    $('#error').hide();
    autom8.Util.getDeviceList();
  }

  function onDisconnected(reason) {
    $('#status').html("disconnected");
    $('#hostname').html("");
    $('#devices').html("");
    $('#error').show();

    var errorMessage = getDisconnectMessage(reason);
    if (errorMessage) {
      $("#error-text").show().html(errorMessage);
    }
    else {
      $("#error-text").hide();
    }
  }

  function onRequestReceived(uri, body) {
  }

  function onResponseReceived(uri, body) {
    body = JSON.parse(body);

    switch (uri) {
      case "autom8://response/get_device_list":
        onGetDeviceListResponse(body);
        break;

      case "autom8://response/device_status_updated":
      case "autom8://response/sensor_status_changed":
        onDeviceUpdatedResponse(body);
        break;
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
    };

    deviceList = new autom8.Model.DeviceList(deviceList, options);

    redrawDeviceList();
  }

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
      case 1: return "could not connect to server";
      case 2: return "ssl handshake failed";
      case 3: return "invalid username or password";
      case 4: return "server sent an invalid message";
      case 5: return "read failed";
      case 6: return "write failed";
      default: return "connection error";
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
      view.rowClass = "device-row on";
      view.action = turnOff;
    }
    else {
      view.buttonClass = "button off";
      view.buttonText = "off";
      view.rowClass = "device-row off";
      view.action = turnOn;
    }

    return elementFromTemplate(deviceRowTemplate, view);
  }

  function renderSecuritySensorRow (device) {
    var address = device.address();
    var tripped = device.tripped();
    var armed = device.armed();
    var on = device.on();

    var view = {
      action: "",
      rowClass: "device-row off",
      buttonText: "",
      buttonClass: "",
      text: device.get('label'),
      subtext: "security sensor " + address
    };

    if (on && tripped) {
      view.buttonClass = "button alert";
      view.buttonText = "alert";
      view.rowClass = "device-row alert";
      view.action = "autom8.Util.confirmResetSecuritySensor('" + address + "')";
    }
    else if (armed) {
      view.buttonClass = "button on";
      view.rowClass = "device-row on";
      view.buttonText = "armed";
      view.action = "autom8.Util.confirmDisarmSecuritySensor('" + address + "')";
    }
    else {
      view.buttonClass = "button off";
      view.buttonText = "off";
      view.action = "autom8.Util.setSecuritySensorArmed('" + address + "', true)";
    }

    return elementFromTemplate(deviceRowTemplate, view);
  }

  function renderDevice(device) {
    switch (device.get('type')) {
    case autom8.DeviceType.Lamp:
    case autom8.DeviceType.Appliance:
      return renderLampOrApplianceRow(device);

    case autom8.DeviceType.SecuritySensor:
      return renderSecuritySensorRow(device);

    default:
      console.log('unknown device type! ' + device.get('type'));
    }

    return $("<div/>");
  }

  function redrawDeviceList() {
    var container = $('#devices');
    container.empty();

    if ((!deviceList) || (_.size(deviceList) < 1)) {
      return;
    }

    var deviceListElement = elementFromTemplate(deviceListTemplate);

    deviceList.each(function(device) {
      deviceListElement.append(renderDevice(device));
    });

    container.append(deviceListElement);
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
      var connected = autom8Client.isConnected();

      if (dirty || !connected) {
        this.reconnect();
      }
      else if (connected) {
        onConnected();
      }
    },

    reconnect: function() {
      _.defer(function() {
        $('#status').html("connecting...");
        $('#hostname').html("");
        $('#error').hide();
      });

      var ls = localStorage;
      var prefs = autom8.Prefs;

      autom8Client.connect(
        ls[prefs.ConnectionHost],
        ls[prefs.ConnectionPort],
        ls[prefs.ConnectionPw]);
    }
  };
}()); // autom8.Controller.DeviceListController
