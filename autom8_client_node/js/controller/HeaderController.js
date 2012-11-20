namespace("autom8.controller").HeaderController = (function() {

  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.HeaderView();
      this.view.on('signout:clicked', this.onSignOutClicked, this);

      autom8Client.connecting.connect(_.bind(this.onConnecting, this));
      autom8Client.connected.connect(_.bind(this.onConnected, this));
      autom8Client.disconnected.connect(_.bind(this.onDisconnected, this));
    },

    onSignOutClicked: function() {
      $.ajax({
        url: 'signout.action',
        type: 'POST',
        success: function(data) {
          window.location = "/";
        },
        error: function (xhr, status, error) {
      }});
    },

    onConnecting: function() {
      this.view.setState("connecting");
    },

    onConnected: function() {
      this.view.setState("connected");
    },

    onDisconnected: function(reason) {
      this.view.setState("disconnected", reason);
    }
  });
}());
