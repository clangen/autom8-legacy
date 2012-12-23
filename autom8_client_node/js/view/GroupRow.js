namespace("autom8.view").GroupRow = (function() {
  var groupRowTemplate = $("#autom8-View-GroupRow").html();

  var _super_ = autom8.view.DeviceRow;

  function renderGroup(device, options) {
      options = options || { };

      var group = device;
      var stats = autom8.util.Device.getDeviceListStats(group.deviceList());
      var allOn = stats.allOn || stats.allArmed;
      var someOn = stats.someOn || stats.someArmed;

      var args = {
        rowClass: allOn ? "device-row on" : (someOn ? "device-row some" : "device-row off"),
        buttonClass: allOn ? "all" : (someOn ? "on" : "off"),
        buttonText: allOn || someOn ? "on" : "off",
        text: group.name(),
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

      return autom8.mvc.View.elementFromTemplate(groupRowTemplate, args);
  }

  return _super_.extend({
    setDevice: function(device) {
      _super_.prototype.setDevice.call(this, device);
      this.render();
    },

    onRender: function() {
      var options = this.options || { };
      var $group = renderGroup(this.device, this.options);

      if (options.asTree !== true) {
        return $group;
      }

      var hiddenHACK = options.collapsed ? ' style="display: none"' : '';
      var $container = $('<div class="device-group-container"></div>');
      var $allDevices = $('<div class="device-group-devices"' + hiddenHACK + '></div>');

      var resume = !options.collapsed;
      
      var listView = this.listView = this.addChild(new autom8.mvc.View(), {
        appendToElement: $allDevices,
        resume: resume
      });

      var devices = group.deviceList();
      devices.each(function(device, index) {
        var deviceOptions = {
          attrs: {
            index: index,
            group: options.attrs.group || 0
          }
        };

        var deviceRow = autom8.view.DeviceRowFactory.create(device, deviceOptions);
        deviceRow.$el.addClass('small');
        
        listView.addChild(deviceRow);
      });

      $container.append($group);
      $container.append($allDevices);

      _.defer(function() {
        $allDevices.css("height", options.collapsed ? 0 : $allDevices.height());
        $allDevices[options.collapsed ? 'hide' : 'show']();
      });

      if (devices.length === 1) {
        $container.find('.expander').addClass('invisible');
      }

      _.each(options.attrs, function(value, key) {
        $group.attr('data-' + key, value);
      });

      this.setElement($container);
    }
  });
}());
