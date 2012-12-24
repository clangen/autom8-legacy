namespace("autom8.view").GroupedDeviceListView = (function() {
  var EXPAND_DURATION_PER_ITEM = 0.075;
  var MAX_TOTAL_EXPAND_DURATION = 0.25;

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
        groupedDeviceList.push(new autom8.model.DeviceGroup({
          name: key,
          deviceList: new autom8.model.DeviceList(value)
        }));
      });

      /* sort */
      groupedDeviceList.sort(function(a, b) {
        return a.name() > b.name();
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
          var groupDevices = group.deviceList();
          var groupName = group.name();
          var groupListView = this.listView.views[groupIndex].listView;

          /* floating point value that represents seconds */
          var duration = Math.min(
            MAX_TOTAL_EXPAND_DURATION,
            groupDevices.length * EXPAND_DURATION_PER_ITEM);

          /* if true we collapse, otherwise we expand */
          var collapse = !!this.expandedGroups[group.name()];

          /* remember group collapsed state and set the expander badge */
          if (collapse) {
            delete this.expandedGroups[group.name()];
            $expander.html('+');
          }
          else {
            this.expandedGroups[group.name()] = 1;
            $expander.html('-');
          }

          /* if animations are enabled, start it now */
          if (autom8.Config.display.animations.collapse) {
            autom8.Animation.css($items, "toggle-group-" + group.name, {
              hwAccel: false,
              duration: duration,
              property: 'height',
              easing: collapse ? 'ease-out' : 'ease-in',
              onPrepared: function() {
                if (collapse) {
                  $items.css("height", 0);
                }
                else {
                  $items.show();
                  $items.css("height", "");
                  $items.css("height", $items.height());
                }
              },
              onCompleted: _.bind(function(canceled) {
                if (!canceled) {
                  $items[collapse ? 'hide' : 'show']();
                  groupListView[collapse ? 'pause' : 'resume']();
                  groupListView.setCollapsed(collapse);
                }
              }, this)
            });
          }
          /* no animation, just toggle visibility */
          else {
            $items[collapse ? 'hide' : 'show']();
            groupListView[collapse ? 'pause' : 'resume']();
            groupListView.setCollapsed(collapse);
          }

          /* remember which groups are expanded so we can restore this
          state whenever we are reloaded */
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
          var device = this.groupedDeviceList[groupIndex].deviceList().at(itemIndex);
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
          collapsed: !self.expandedGroups[group.name()],
          attrs: {
            group: index
          }
        };

        var groupRow = autom8.view.DeviceRowFactory.create(group, options);
        self.listView.addChild(groupRow);
      });
    },

    setDeviceList: function(deviceList) {
      if (deviceList === this.deviceList) {
        return;
      }

      this.deviceList = deviceList;
      this.groupedDeviceList = createGroupedDeviceList(deviceList);
      this.render();
    }
  });
}());
