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

      this.deviceList().on('change:updating', _.bind(this.onDeviceUpdating, this));
    },

    name: function(newName) {
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