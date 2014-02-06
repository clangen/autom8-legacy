namespace("autom8.controller").SignInController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      options = options || { };

      this.view = new autom8.view.SignInView({
        el: options.el
      });

      this.view.on("return:pressed", this.signIn, this);
    },

    onResume: function() {
      autom8.client.on('state:changed', this.onStateChanged, this);
      this.view.focusPasswordInput(true);
    },

    onPause: function() {
      autom8.client.off('state:changed', this.onStateChanged, this);
      this.view.focusPasswordInput(false);
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
      this.view.focusPasswordInput(false);
      autom8.client.authenticate(this.view.$('#password').val());
    }
  });
}());