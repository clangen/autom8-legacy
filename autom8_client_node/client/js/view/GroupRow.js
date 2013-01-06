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
        subtextClass: "",
        expander: options.collapsed ? "+" : "-"
      };

      if (stats.someTripped || stats.allTripped) {
        args.buttonClass = "alert";
        args.buttonText = "alert";
        args.rowClass = "device-row alert";
        args.subtextClass = "gone";
      }
      else if (allOn) {
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
      var $allDevices = $('<div></div>');

      var listView = this.listView = new autom8.view.GroupRowListView({
        group: this.device
      });

      var collapsed = listView.collapsed;
      var resume = !collapsed;

      this.addChild(listView, {appendToElement: $allDevices, resume: resume});

      var devices = group.deviceList();
      devices.each(function(device, index) {
        var deviceOptions = {
          attrs: {
            index: index,
            group: options.attrs.group || 0
          },

          spinnerOptions: {
            radius: 6
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
      this.redrawExpander();

      addDataAttributes($group, options.attrs);
    },

    redrawExpander: function() {
      if (this.device.deviceList().length > 1) {
        this.$group.addClass('has-expander');
        var $expander = this.$group.find('.expander-button');
        $expander.html(this.listView.collapsed ? '+' : '-');
      }
      else {
        this.$group.removeClass('has-expander');
      }
    },

    toggleCollapsed: function() {
      this.listView.toggleCollapsed();
      this.redrawExpander();
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
      this.redrawExpander();

      addDataAttributes($group, options.attrs);
    }
  });
}());
