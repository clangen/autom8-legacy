namespace("autom8.model").SystemModel = (function() {
  var fetching;

  var Model = Backbone.Model.extend({
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
        var attrs = _.extend({devices: devices.devices}, status);
        self.set(attrs);
      })

      .done(function(result) {
        fetching = false;
      });
    }
  });

  return new Model();
}());