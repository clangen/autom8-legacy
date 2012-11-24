namespace("autom8.controller").SignInController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.SignInView();
      
      this.view.on("return:pressed", this.signIn, this);
      autom8.view.HeaderView.staticEvents.on("signin:clicked", this.signIn, this);
      autom8Client.authenticated.connect(_.bind(this.onAuthenticated, this));
      autom8Client.disconnected.connect(_.bind(this.onDisconnected, this));
    },

    onDestroy: function() {
      autom8.view.HeaderView.staticEvents.off("signin:clicked", this.signIn, this);
    },

    onAuthenticated: function() {
      window.location = "/";
    },

    onDisconnected: function() {
      this.view.setState("error");
    },

    signIn: function() {
      this.view.setState("loading");
      autom8Client.authenticate(this.view.$('#password').val());
    }
  });
}());