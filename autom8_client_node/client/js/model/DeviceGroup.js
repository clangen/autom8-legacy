namespace("autom8.model").DeviceGroup = (function() {
  var _super_ = Backbone.Model.prototype;

  return Backbone.Model.extend({
    initialize: function(attrs, options) {
      if (!attrs || !attrs.name || !attrs.deviceList) {
        console.log("DeviceGroup: construction failed, no name or deviceList");
        throw {error: 'no name or deviceList specified'};
      }

      _super_.initialize.call(this, attrs, options);

      this.updatingDevices = { };
      this.updatingCount = 0;
      this.isGroup = true;
      this.refreshStats();

      this.deviceList().on('change:updating', _.bind(this.onDeviceUpdating, this));
      this.deviceList().on('change', _.bind(this.refreshStats, this));
    },

    sortKey: function() {
      return this.get('sortKey');
    },

    name: function() {
      return this.get('name');
    },

    deviceList: function() {
      return this.get('deviceList');
    },

    updating: function() {
      return this.get('updating') || false;
    },

    stats: function() {
      return this.get('stats');
    },

    refreshStats: function() {
      var newStats = autom8.util.Device.getDeviceListStats(this.deviceList());
      this.set('stats', newStats);
      this.set('sortKey', String(newStats.trippedCount ? "0" : "1") + '-' + this.name());
    },

    onDeviceUpdating: function(device, updating) {
      var addr = device.address();

      if (updating) {
        if (!this.updatingDevices[addr]) {
          this.updatingDevices[addr] = 1;
          this.updatingCount++;

          if (this.updatingCount === 1) {
            this.set('updating', true);
          }
        }
      }
      else {
        if (this.updatingDevices[addr]) {
          delete this.updatingDevices[addr];
          this.updatingCount--;

          if (this.updatingCount === 0) {
            this.set('updating', false);
          }
        }
      }
    }
  });
}());