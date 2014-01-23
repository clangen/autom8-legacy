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

        var deviceList = self.get('deviceList');

        deviceList.reset(); /* right now we're sloppy; always re-initialize. if we
          get to the point where we're handling so many devices this is too wasteful
          then that's a good thing. */

        var device;
        for (var i = 0; i < devices.length; i++) {
          /* bleh, "attributes" conflicts with the backbone Model's
          internal field. rename to attrs */
          devices[i].attrs = devices[i].attributes;
          delete devices[i].attributes;

          /* update needs the raw data. currently: we never actually update because
          we clear the device list above. in the future, when supporting lots of
          devices, we may want to only update devices that have changed. */
          if (!deviceList.update(devices[i])) {
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