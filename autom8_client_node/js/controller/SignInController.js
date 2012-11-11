autom8.Controller.SignInController = (function() {
  function SignInController() {
  }

  var SignInController = autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.View.SignInView();
      this.loadingTimeout = null;
      this.view.on("signin:clicked", this.signIn, this);
    },

    signIn: function(password) {
      this.loadingTimeout = setTimeout(_.bind(function() {
        this.view.setState("loading");
      }, this), 500);

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

  return SignInController;
}());