namespace("autom8.model").SystemModel = (function() {
  var fetching;

  var Model = Backbone.Model.extend({
    initialize: function() {
      this.set({
        deviceList: new autom8.model.DeviceList()
      });
    },

    fetch: function() {
      if (fetching) {
        return;
      }

      var self = this;

      Q.all([
        autom8.client.rpc.send({
          component: "server", command: "status", options: { }
        }),

        autom8.client.rpc.send({
          component: "system", command: "list_devices", options: { }
        })
      ])

      .spread(function(status, devices) {
        devices = devices.devices || [];

        var deviceList = self.get('deviceList'), device;
        for (var i = 0; i < devices.length; i++) {
          /* bleh, "attributes" conflicts with the backbone Model's
          internal field. rename to attrs */
          devices[i].attrs = devices[i].attributes;
          delete devices[i].attributes;

          if (!deviceList.update(devices[i])) { /* update needs the raw data */
            device = new autom8.model.Device(devices[i]);
            deviceList.add(device);
          }
        }

        self.set(status);
      })

      .done(function(result) {
        fetching = false;
      });
    }
  });

  return new Model();
}());