namespace("autom8.view").GroupedDeviceListView = (function() {
  var EXPAND_DURATION_PER_ITEM = 50;
  var MAX_TOTAL_EXPAND_DURATION = 200;

  var View = autom8.mvc.View;

  function createGroupedDeviceList(deviceList) {
      /* build map of groups */
      var groupMap = { };
      deviceList.each(function(device) {
        _.each(device.get('groups'), function(group) {
          groupMap[group] = groupMap[group] || [];
          groupMap[group].push(device);
        });
      });

      /* flatten to array so we can sort */
      var groupedDeviceList = [];
      _.each(groupMap, function(value, key) {
        groupedDeviceList.push({name: key, devices: value});
      });

      /* sort */
      groupedDeviceList.sort(function(a, b) {
        return a.name > b.name;
      });

      return groupedDeviceList;
  }

  var _super_ = autom8.view.DeviceListView;

  return _super_.extend({
    events: {
      "touch .device-row .expander": function(e) {
        var $root = $(e.currentTarget).parents('.device-group-container');
        var $group = $root.find('.device-row.group');
        var $expander = $root.find('.expander-button');
        var $items = $root.find('.device-group-devices');

        var groupIndex = $group.attr("data-group");
        if (groupIndex) {
          var group = this.groupedDeviceList[Number(groupIndex)];

          var animate = autom8.Config.display.animations.collapse;
          var duration = Math.min(
            MAX_TOTAL_EXPAND_DURATION,
            group.devices.length * EXPAND_DURATION_PER_ITEM);

          if (this.expandedGroups[group.name]) {
            delete this.expandedGroups[group.name];
            $expander.html('+');

            if (animate) {
              $items.slideUp(duration, 'easeOutCubic');
            }
            else {
              $items.hide();
            }
          }
          else {
            this.expandedGroups[group.name] = 1;
            $expander.html('-');

            if (animate) {
              $items.slideDown(duration, 'easeInCubic');
            }
            else {
              $items.show();
            }
          }

          try {
            localStorage['autom8.expandedGroups'] = JSON.stringify(this.expandedGroups);
          }
          catch (ex) {
            console.log('failed to write group view info to localStorage');
          }
        }
      },
      "touch .device-row": function(e) {
        var $el = $(e.currentTarget);

        var groupIndex = $el.attr("data-group");
        var itemIndex = $el.attr("data-index");

        if (groupIndex && itemIndex) {
          groupIndex = parseInt(groupIndex, 10);
          itemIndex = parseInt(itemIndex, 10);
          var device = this.groupedDeviceList[groupIndex].devices[itemIndex];
          this.trigger('devicerow:clicked', device);
        }
        else if (groupIndex) {
          groupIndex = parseInt(groupIndex, 10);
          var group = this.groupedDeviceList[groupIndex];
          this.trigger('grouprow:clicked', group);
        }
      }
    },

    onCreate: function(options) {
      _super_.prototype.onCreate.call(this, options);
      this.groupedDeviceList = [];

      /* keyed by name */
      try {
        this.expandedGroups = JSON.parse(localStorage['autom8.expandedGroups']);
      }
      catch (ex) {
      }
      this.expandedGroups = this.expandedGroups || { };
    },

    onRender: function() {
      this.listView.clearChildren();

      if (this.groupedDeviceList.length < 1) {
        return;
      }

      var self = this;
      _.each(this.groupedDeviceList, function(group, index) {
        var options = {
          asTree: true,
          collapsed: !self.expandedGroups[group.name],
          attrs: {
            group: index
          }
        };

        var groupRow = autom8.view.DeviceRowFactory.create(group, options);
        self.listView.addChild(groupRow);
      });
    },

    setDeviceList: function(deviceList) {
      this.deviceList = deviceList;
      this.groupedDeviceList = createGroupedDeviceList(deviceList);
      this.render();
    }
  });
}());
