namespace("autom8.view").DeviceRowFactory = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();
  var groupRowTemplate = $("#autom8-View-GroupRow").html();

  function createFromGroup(group, options) {
    options = options || { };

    var stats = autom8.util.Device.getDeviceListStats(group.devices);
    var allOn = stats.allOn || stats.allArmed;
    var someOn = stats.someOn || stats.someArmed;

    var args = {
      rowClass: allOn ? "device-row on" : (someOn ? "device-row some" : "device-row off"),
      buttonClass: allOn ? "all" : (someOn ? "on" : "off"),
      buttonText: allOn || someOn ? "on" : "off",
      text: group.name,
      subtext: stats.totalCount + " devices",
      expander: options.collapsed ? "+" : "-"
    };

    if (allOn) {
      args.buttonSubtext = "(all on)";
    }
    else if (someOn) {
      var onCount = stats.onCount + stats.armedCount;
      args.buttonSubtext = "(" + onCount + "/" + stats.totalCount + " on)";
    }
    else {
      args.buttonSubtext = "(all off)";
    }

    var $group = autom8.mvc.View.elementFromTemplate(groupRowTemplate, args);

    _.each(options.attrs, function(value, key) {
      $group.attr('data-' + key, value);
    });

    if (options.asTree !== true) {
      return $group;
    }

    var hiddenHACK = options.collapsed ? ' style="display: none"' : '';

    var $container = $('<div class="device-group-container"></div>');
    var $allDevices = $('<div class="device-group-devices"' + hiddenHACK + '></div>');

    _.each(group.devices, function(device, index) {
      var deviceOptions = {
        elementOnly: true,
        attrs: {
          index: index,
          group: options.attrs.group || 0
        }
      };

      var $device = autom8.view.DeviceRowFactory.create(device, deviceOptions);
      $device.addClass('small');
      $allDevices.append($device);
    });

    $container.append($group);
    $container.append($allDevices);

    _.defer(function() {
      $allDevices.css("height", options.collapsed ? 0 : $allDevices.height());
      $allDevices[options.collapsed ? 'hide' : 'show']();
    });

    if (group.devices.length === 1) {
      $container.find('.expander').hide();
    }

    return $container;
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
    create: function(device, options) {
      options = options || { };
      var result = $("<div/>");

      if (device && device.name && device.devices && device.devices.length) {
        /* we found a group! */
        return new autom8.mvc.View({el: createFromGroup(device, options)});
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

      _.each(options.attrs, function(value, key) {
        result.attr('data-' + key, value);
      });

      if (options.elementOnly) {
        return result;
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
