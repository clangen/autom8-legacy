namespace("autom8.view").GroupedDeviceListView = (function() {
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
    },

    onRender: function() {
      this.listView.clearChildren();

      if (this.groupedDeviceList.length < 1) {
        return;
      }

      var self = this;
      _.each(this.groupedDeviceList, function(group, index) {
        var options = {
          asTree: false,
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
