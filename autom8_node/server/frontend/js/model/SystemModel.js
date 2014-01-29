namespace("autom8.model").SystemModel = (function() {
  var fetching;

  var Model = Backbone.Model.extend({
    initialize: function() {
      this.set({
        deviceList: new autom8.model.DeviceList(),
        systemList: new Backbone.Collection()
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
        }),

        autom8.client.rpc.send({
          component: "system", command: "list", options: { }
        })
      ])

      .spread(function(status, devices, systems) {
        self.set('initialized', true);

        devices = devices.devices || [];

        var i;
        var deviceList = self.get('deviceList');

        deviceList.reset(); /* right now we're sloppy; always re-initialize. if we
          get to the point where we're handling so many devices this is too wasteful
          then that's a good thing. */

        var device;
        for (i = 0; i < devices.length; i++) {
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

        var systemList = self.get('systemList');
        systemList.reset();
        systems = systems.systems;
        for (i = 0; i < systems.length; i++) {
          systemList.add(new Backbone.Model({
            name: systems[i]
          }));
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