namespace("autom8.view").DeviceRowFactory = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();
  var groupRowTemplate = $("#autom8-View-GroupRow").html();

  function countOnInGroup(group) {
    var on = 0;
    for (var i = 0; i < group.devices.length; i++) {
      if (group.devices[i].get('status') == autom8.DeviceStatus.On) {
        on++;
      }
    }
    return on;
  }

  function createFromGroup(group) {
    var onInGroup = countOnInGroup(group);
    var someOn = !!onInGroup;
    var allOn = onInGroup === group.devices.length;

    var args = {
      rowClass: "",
      buttonClass: allOn ? "all" : (someOn ? "on" : "off"),
      buttonText: someOn ? "on" : "off",
      text: group.name,
      subtext: group.devices.length + " devices"
    };

    if (allOn) {
      args.buttonSubtext = "(all on)";
    }
    else if (someOn) {
      args.buttonSubtext = "(" + onInGroup + "/" + group.devices.length + " on)";
    }
    else {
      args.buttonSubtext = "(all off)";
    }

    return autom8.mvc.View.elementFromTemplate(groupRowTemplate, args);
  }

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

    return autom8.mvc.View.elementFromTemplate(deviceRowTemplate, args);
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

    return autom8.mvc.View.elementFromTemplate(deviceRowTemplate, args);
  }

  /* public api */
  return {
    create: function(device) {
      var result = $("<div/>");

      if (device && device.name && device.devices && device.devices.length) {
        /* we found a group! */
        return new autom8.mvc.View({el: createFromGroup(device)});
      }

      switch (device.get('type')) {
      case autom8.DeviceType.Lamp:
        result = createFromLampOrAppliance(device, "lamp");
        break;

      case autom8.DeviceType.Appliance:
        result = createFromLampOrAppliance(device, "appliance");
        break;

      case autom8.DeviceType.SecuritySensor:
        result = createFromSecuritySensor(device);
        break;

      default:
        console.log('unknown device type! ' + device.get('type'));
      }

      return new autom8.mvc.View({el: result});
    },

    createGroup: function(group) {
      if (!group || !group.name || !group.devices || !group.devices.length) {
        console.log('invalid device row');
        return null;
      }
    }
  };
}());
