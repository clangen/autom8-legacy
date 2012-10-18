autom8.View.DeviceRowFactory = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();

  function createFromLampOrAppliance(device, type) {
    var address = device.get('address');

    var args = {
      rowClass: "",
      buttonClass: "",
      buttonText: "",
      text: device.get('label'),
      subtext: ""
    };

    if (device.get('type') == autom8.DeviceType.Lamp) {
      args.subtext = "lamp " + address;
    }
    else {
      args.subtext = "appliance " + address;
    }

    if (device.get('status') == autom8.DeviceStatus.On) {
      args.buttonClass = "button on";
      args.buttonText = "on";
      args.rowClass = "device-row on";
    }
    else {
      args.buttonClass = "button off";
      args.buttonText = "off";
      args.rowClass = "device-row off";
    }

    return autom8.View.Util.elementFromTemplate(deviceRowTemplate, args);
  }

  function createFromSecuritySensor(device) {
    var address = device.address();
    var tripped = device.tripped();
    var armed = device.armed();
    var on = device.on();

    var args = {
      action: "",
      rowClass: "device-row off",
      buttonText: "",
      buttonClass: "",
      text: device.get('label'),
      subtext: "security sensor " + address
    };

    if (on && tripped) {
      args.buttonClass = "button alert";
      args.buttonText = "alert";
      args.rowClass = "device-row alert";
    }
    else if (armed) {
      args.buttonClass = "button on";
      args.rowClass = "device-row on";
      args.buttonText = "armed";
    }
    else {
      args.buttonClass = "button off";
      args.buttonText = "off";
    }

    return autom8.View.Util.elementFromTemplate(deviceRowTemplate, args);
  }

  /*
   * public api
   */
  return {
    create: function(device) {
      switch (device.get('type')) {
      case autom8.DeviceType.Lamp:
        return createFromLampOrAppliance(device, "lamp");

      case autom8.DeviceType.Appliance:
        return createFromLampOrAppliance(device, "appliance");

      case autom8.DeviceType.SecuritySensor:
        return createFromSecuritySensor(device);

      default:
        console.log('unknown device type! ' + device.get('type'));
      }

      return $("<div/>");
    }
  };
}()); // autom8.Controller.DeviceListController
