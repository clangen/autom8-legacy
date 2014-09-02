namespace("autom8.model").DeviceList = (function() {
  return Backbone.Collection.extend({
    model: autom8.model.Device,

    update: function(device, options) {
        options = options || { };
        var existing = this.findWhere({address: options.address || device.address});

        if (existing) {
            existing.set(device);
        }

        return !!existing;
    }
  });
}());
