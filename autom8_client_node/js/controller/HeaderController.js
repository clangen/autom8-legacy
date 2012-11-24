namespace("autom8.controller").HeaderController = (function() {

  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.HeaderView();
      this.view.on('signout:clicked', this.onSignOutClicked, this);

      autom8Client.connecting.connect(_.bind(this.onConnecting, this));
      autom8Client.authenticating.connect(_.bind(this.onAuthenticating, this));
      autom8Client.authenticated.connect(_.bind(this.onAuthenticated, this));
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

    onAuthenticating: function() {
      this.view.setState("authenticating");
    },

    onAuthenticated: function() {
      this.view.setState("authenticated");
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
