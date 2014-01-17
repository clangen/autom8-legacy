namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.view.MainView({ el: $('.main-content-left') });

      var self = this;

      this.view.on('start:clicked', function() {
        autom8.client.rpc.send({
          component: "server", command: "start", options: { }
        });
      });

      this.view.on('stop:clicked', function() {
        autom8.client.rpc.send({
          component: "server", command: "stop", options: { }
        });
      });

      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);
      autom8.client.on('expired', this.onDisconnected, this);
      autom8.client.on('state:changed', this.onClientStateChanged, this);

      /* get auth cookie. after we have the auth cookie we can connect */
      autom8.client.authenticate("empty");
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
      autom8.client.off('expired', this.onDisconnected, this);
      autom8.client.pff('state:changed', this.onClientStateChanged, this);
    },

    onConnected: function() {
      $('.connection').css('background-color', 'green');

      var self = this;

      autom8.client.rpc.send({
        component: "server", command: "status", options: { }
      })
      .then(function(result) {
        self.view.statusView.update(result);
      });

      autom8.client.rpc.send({
        component: "system", command: "list_devices", options: { }
      })
      .then(function(result) {
        self.view.devicesView.update(result);
      });
    },

    onDisconnected: function() {
      $('.connection').css('background-color', 'red');
    },

    onClientStateChanged: function(state) {
      if (state === "authenticated") {
        autom8.client.connect();
      }
    }
  });
}());