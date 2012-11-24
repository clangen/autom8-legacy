namespace("autom8.controller").HeaderController = (function() {

  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.HeaderView();
      this.view.on('signout:clicked', this.onSignOutClicked, this);

      autom8.client.on('connecting', _.bind(this.onConnecting, this));
      autom8.client.on('authenticating', _.bind(this.onAuthenticating, this));
      autom8.client.on('authenticated', _.bind(this.onAuthenticated, this));
      autom8.client.on('connected', _.bind(this.onConnected, this));
      autom8.client.on('disconnected', _.bind(this.onDisconnected, this));
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
