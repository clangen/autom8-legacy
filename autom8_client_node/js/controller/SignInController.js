namespace("autom8.controller").SignInController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.SignInView();
      this.view.on("return:pressed", this.signIn, this);
    },

    onResume: function() {
      autom8.view.HeaderView.staticEvents.on("signin:clicked", this.signIn, this);
      autom8.client.on('state:changed', this.onStateChanged, this);
    },

    onPause: function() {
      autom8.view.HeaderView.staticEvents.off("signin:clicked", this.signIn, this);
      autom8.client.off('state:changed', this.onStateChanged, this);
    },

    onStateChanged: function(state, options) {
      this.view.setState(state, options);

      if (state === 'authenticated') {
        this.view.$('#password').val("");
        autom8.client.connect();
      }
    },

    signIn: function() {
      this.view.setState("loading");
      autom8.client.authenticate(this.view.$('#password').val());
    }
  });
}());