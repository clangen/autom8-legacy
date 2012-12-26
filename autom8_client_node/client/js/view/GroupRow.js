namespace("autom8.view").GroupRow = (function() {
  var groupRowTemplate = $("#autom8-View-GroupRow").html();

  var _super_ = autom8.view.DeviceRow;

  function renderGroup(group, options) {
      options = options || { };

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

  function addDataAttributes($div, map) {
    _.each(map, function(value, key) {
      $div.attr('data-' + key, value);
    });
  }

  return _super_.extend({
    className: 'device-group-container',

    setDevice: function(device) {
      _super_.prototype.setDevice.call(this, device);
      this.render();
    },

    renderUpdatedGroup: function(options) {
      /* TODO: hacky? the collapsed var is only set in the options when
      this view is initialized, but when we update we need to pull the
      current state from the subview... seems this could be better */
      options.collapsed = this.listView.collapsed;

      var $group = renderGroup(this.device, options);
      $group.insertBefore(this.$group);
      this.$group.remove();
      this.$group = $group;
      this.appendSpinner({radius: 8});
      addDataAttributes($group, options.attrs);

      if (this.device.deviceList().length === 1) {
        this.$el.find('.expander').addClass('invisible');
      }
    },

    onRender: function(renderOptions) {
      var options = this.options || { };
      var group = this.device;

      /* if this is due to a device change, just render the group row;
      the sub-rows will re-render themselves automatically if necessary */
      if (renderOptions && renderOptions.change) {
        this.renderUpdatedGroup(options);
        return;
      }

      var $group = renderGroup(this.device, this.options);
      var hiddenHACK = options.collapsed ? ' style="display: none"' : '';
      var $allDevices = $('<div class="device-group-devices"' + hiddenHACK + '></div>');

      var resume = !options.collapsed;
      
      var listView = this.listView = new autom8.view.GroupRowListView({
        collapsed: !!options.collapsed
      });

      this.addChild(listView, {appendToElement: $allDevices, resume: resume});

      var devices = group.deviceList();
      devices.each(function(device, index) {
        var deviceOptions = {
          attrs: {
            index: index,
            group: options.attrs.group || 0
          }
        };

        var deviceRow = autom8.view.DeviceRowFactory.create(device, deviceOptions);
        listView.addChild(deviceRow);
      });

      this.$el.empty();
      this.$el.append($group);
      this.$el.append($allDevices);
      this.$group = $group;
      this.$allDevices = $allDevices;

      this.appendSpinner({radius: 8});
      addDataAttributes($group, options.attrs);

      if (devices.length === 1) {
        this.$el.find('.expander').addClass('invisible');
      }

      _.defer(function() {
        $allDevices.css("height", options.collapsed ? 0 : $allDevices.height());
        $allDevices[options.collapsed ? 'hide' : 'show']();
      });
    }
  });
}());
