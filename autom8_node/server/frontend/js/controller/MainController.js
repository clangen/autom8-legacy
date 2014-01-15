namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.view.MainView();
      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);
      autom8.client.on('expired', this.onDisconnected, this);
      autom8.client.authenticate("empty");

      setTimeout(function() {
        autom8.client.connect();

        setTimeout(function() {
          // autom8.client.send("autom8://service/rpc", {
          //     component: "server",
          //     command: "start",
          //     options: { }
          // });
        }, 2000);
      }, 2000);
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
      autom8.client.off('expired', this.onDisconnected, this);
    },

    onConnected: function() {

    },

    onDisconnected: function() {
      debugger;
    }
  });
}());