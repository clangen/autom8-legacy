namespace("autom8.view").DeviceRowFactory = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();
  var groupRowTemplate = $("#autom8-View-GroupRow").html();

  function createSpinner(options) {
    options = options || { };

    return new autom8.view.SpinnerView({
      el: $('<div class="row-spinner-container"></div>'),
      spinnerSelector: null,
      spinnerOptions: {
        radius: options.radius || 6,
        className: 'row-spinner'
      }
    });
  }

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

    var groupRow = new autom8.mvc.View({el: $container});

    var resume = !options.collapsed;
    
    var listView = groupRow.listView = groupRow.addChild(new autom8.mvc.View(), {
      appendToElement: $allDevices,
      resume: resume
    });

    group.devices.each(function(device, index) {
      var deviceOptions = {
        attrs: {
          index: index,
          group: options.attrs.group || 0
        }
      };

      var deviceRow = factory.create(device, deviceOptions);
      deviceRow.$el.addClass('small');
      
      listView.addChild(deviceRow);
    });

    $container.append($group);
    $container.append($allDevices);

    _.defer(function() {
      $allDevices.css("height", options.collapsed ? 0 : $allDevices.height());
      $allDevices[options.collapsed ? 'hide' : 'show']();
    });

    if (group.devices.length === 1) {
      $container.find('.expander').addClass('invisible');
    }

    groupRow.spinner = createSpinner({radius: 8});
    groupRow.addChild(groupRow.spinner, {appendAfterElement: '.device-row-info'});

    return groupRow;
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
  var factory = {
    create: function(device, options) {
      options = options || { };
      var result = $("<div/>");

      if (device && device.name && device.devices && device.devices.length) {
        /* we found a group! */
        return createFromGroup(device, options);
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

      var rowView = new autom8.mvc.View({el: result});
      rowView.spinner = createSpinner({radius: 6});
      rowView.addChild(rowView.spinner, {appendAfterElement: '.device-row-info', resume: false});

      return rowView;
    }
  };

  return factory;
}());
