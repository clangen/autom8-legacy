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
        var index = parseInt($el.attr("data-index"), 10);

        var group = this.groupedDeviceList[index];
        this.trigger('grouprow:clicked', group);
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
        var groupRow = autom8.view.DeviceRowFactory.create(group);
        groupRow.$el.attr("data-index", index);
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
