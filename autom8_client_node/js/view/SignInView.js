namespace("autom8.view").SignInView = (function() {
  var View = autom8.mvc.View.extend({
    mixins: [],

    events: {
      "touch #sign-in-button": function() {
        this.trigger("signin:clicked", $("#password").val());
      },

      "keydown": function(e) {
        if (e.keyCode == 13) {
          this.trigger("signin:clicked", $("#password").val());
        }
      }
    },

    onCreate: function(options) {
      this.spinner = this.addChild(new autom8.view.SpinnerView());
      this.setState("initialized");
    },

    setState: function(state) {
      var $passwordRow = $('.password-row');

      switch (state) {
        case "loading":
          $passwordRow.hide();
          this.spinner.start();
          break;

        case "error":
          $passwordRow.show();
          this.spinner.stop();

          autom8.util.Dialog.show({
            title: "Failed to sign in",
            message: "Please check your password and try again.",
            icon: autom8.util.Dialog.Icon.Information,
            buttons: [{
                caption: "ok",
                callback: function() {
                  $("#password").focus();
                },
                positive: true,
                negative: true
            }]
          });
          break;

        default:
          $passwordRow.show();
          $("#password").focus();
          this.spinner.stop();
          break;
      }
    }
  });

  return View;
}());
