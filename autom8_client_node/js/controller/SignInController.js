namespace("autom8.controller").SignInController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.SignInView();
      this.loadingTimeout = null;

      this.view.on("return:pressed", this.signIn, this);
      autom8.view.HeaderView.staticEvents.on("signin:clicked", this.signIn, this);
    },

    onDestroy: function() {
      autom8.view.HeaderView.staticEvents.off("signin:clicked", this.signIn, this);
    },

    signIn: function() {
      this.loadingTimeout = setTimeout(_.bind(function() {
        this.view.setState("loading");
      }, this), 500);

      var password = this.view.$('#password').val();

      var self = this;

      var hash = Crypto.util.bytesToHex(
          Crypto.SHA1(password, { asBytes: true }));

      $.ajax({
        url: 'signin.action',
        type: 'POST',
        data: {
          password: hash
        },
        success: function(data) {
          self.cancelLoadingTimeout();
          self.view.setState("loaded");
          window.location = "/";
        },
        error: function (xhr, status, error) {
          self.cancelLoadingTimeout();
          self.view.setState("error");
        }
      });
    },

    cancelLoadingTimeout: function() {
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
        this.loadingTimeout = null;
      }
    }
  });
}());