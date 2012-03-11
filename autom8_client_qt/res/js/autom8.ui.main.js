if ( ! autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

$(document).ready(function() {
  $('#settings').click(function() {
    window.location = "settings.html";
  });

  $('#connectButton').click(function() {
    autom8.Ui.Main.reconnect();
  });

  $('#error').hide();
});

autom8.Ui.Main = (function() {
  /*
   * private api
   */
  var deviceList;

  function onConnected() {
    $('#status').html('connected<span style="font-size: 85%;"> @</span>');
    $('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);
    $('#error').hide();
    autom8.getDeviceList();
  }

  function onDisconnected(reason) {
    $('#status').html("not connected");
    $('#hostname').html("");
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
    redrawDeviceList();
  };

  function onDeviceUpdatedResponse(body) {
    var address = body.address;

    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i].address === address) {
        deviceList[i] = body;
        redrawDeviceList();
        return;
      }
    }
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
    var buttonClass = "";
    var buttonText = "";
    var subtext = "";
    var turnOn = "autom8.setDeviceStatus('" + device.address + "', autom8.DeviceStatus.On)";
    var turnOff = "autom8.setDeviceStatus('" + device.address + "', autom8.DeviceStatus.Off)";
    var action = "";
    var rowClass;

    if (device.type == autom8.DeviceType.Lamp) {
      subtext = "lamp module " + device.address;
    }
    else {
      subtext = "appliance module " + device.address;
    }

    if (device.status == autom8.DeviceStatus.On) {
      buttonClass = "onButton";
      buttonText = "on";
      rowClass = "onRow";
      action = turnOff;
    }
    else {
      buttonClass = "offButton";
      buttonText = "off";
      rowClass = "offRow";
      action = turnOn;
    }
    
    var html = "";
    html += '<tr class="' + rowClass + '" onclick="' + action + '">';
    html += '  <td class="' + buttonClass + '">' + buttonText + '</td>';
    html += '  <td class="label">' + device.label + '<div class="subtext">' + subtext + '</div></td>';
    html += '</tr>';

    return html;
  }

  function renderSecuritySensorRow (device) {
    var action = "";
    var rowClass = "offRow"
    var buttonText = "";
    var buttonClass = "";
    var subtext = "security sensor " + device.address;

    if (device.status == autom8.DeviceStatus.On && device.attributes.tripped) {
      buttonClass = "alertButton";
      buttonText = "alert";  
      rowClass = "alertRow";
      action = "autom8.Ui.Main.Util.confirmResetSecuritySensor('" + device.address + "')";
    }
    else if (device.attributes.armed) {
      buttonClass = "onButton";
      rowClass = "onRow"
      buttonText = "armed";
      action = "autom8.Ui.Main.Util.confirmDisarmSecuritySensor('" + device.address + "')";
    }
    else {
      buttonClass = "offButton";
      buttonText = "off";
      action = "autom8.setSecuritySensorArmed('" + device.address + "', true)";
    }

    var html = "";
    html += '<tr class="' + rowClass + '" onclick="' + action + '">';
    html += '  <td class="' + buttonClass + '">' + buttonText + '</td>';
    html += '  <td class="label">' + device.label + '<div class="subtext">' + subtext + '</div></td>';
    html += '</tr>';

    return html;
  }

  function redrawDeviceList() {
    if (( ! deviceList) || (deviceList.length < 1)) {
      $('#devices').html("");
      return;
    }

    deviceList.sort(autom8.deviceSort);

    var device;
    var html = '<table class="deviceList">';
    for (var i = 0; i < deviceList.length; i++) {
      device = deviceList[i];

      switch (device.type) {
      case autom8.DeviceType.Lamp:
      case autom8.DeviceType.Appliance:
        html += renderLampOrApplianceRow(device);
        break;

      case autom8.DeviceType.SecuritySensor:
        html += renderSecuritySensorRow(device);
        break;

      default:
        alert(device.type);
        break;
      }
    }

    html += "</table>";

    $('#devices').html(html);
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
      var configured = autom8.Prefs.hasConfiguredConnection();
      var connected = autom8Client.isConnected();

      if (dirty || (configured && !connected)) {
        autom8.Ui.Main.reconnect();
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
    },

    Util: {
      confirmResetSecuritySensor: function(deviceAddress) {
        var confirmCallback = 
          'autom8.resetSecuritySensor("' + deviceAddress + '");'

        var dialog = {
          title: "Confirm reset alert",
          message: "Are you sure you want to reset this security alert?",
          icon: autom8.Ui.Dialog.Icon.Question,
          buttons: [
            {
              caption: "Yes",
              callback: confirmCallback    
            },
            {
              caption: "No",
              callback: null   
            }
          ]
        };

        autom8.Ui.Dialog.show(dialog);
      },

      confirmDisarmSecuritySensor: function(deviceAddress) {
        var confirmCallback = 
          'autom8.setSecuritySensorArmed("' + deviceAddress + '", false);'

        var dialog = {
          title: "Confirm sensor disarm",
          message: "Are you sure you want to disarm this security sensor?",
          icon: autom8.Ui.Dialog.Icon.Question,
          buttons: [
            {
              caption: "Yes",
              callback: confirmCallback    
            },
            {
              caption: "No",
              callback: null   
            }
          ]
        };

        autom8.Ui.Dialog.show(dialog);
      }
    }
  }
})(); // autom8.Ui.Main