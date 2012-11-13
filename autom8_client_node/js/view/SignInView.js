autom8.View.SignInView = (function() {
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
      this.spinner = autom8.Spinner.create("loading-spinner");
      this.setState("initialized");
    },

    setState: function(state) {
      var $passwordRow = $('.password-row');
      var $loadingRow = $('#loading-row');

      switch (state) {
        case "loading":
          $loadingRow.show();
          $passwordRow.hide();
          this.spinner.start();
          break;

        case "error":
          $loadingRow.hide();
          $passwordRow.show();
          this.spinner.stop();

          autom8.Util.Dialog.show({
            title: "Failed to sign in",
            message: "Please check your password and try again.",
            icon: autom8.Util.Dialog.Icon.Information,
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
          $loadingRow.hide();
          $passwordRow.show();
          $("#password").focus();
          this.spinner.stop();
          break;
      }
    },

    showLoadingSpinner: function(show) {
      show = (show !== undefined) ? show : true;

      if (!this.loadingSpinner) {
        this.loadingSpinner = autom8.Spinner.create("loading-spinner");
        this.$loadingRow = $("#loading-row");
      }

      if (show) {
        this.$loadingRow.show();
        this.loadingSpinner.start();
      }
      else {
        this.$loadingRow.hide();
        this.loadingSpinner.stop();
      }
    }
  });

  return View;
}()); /* autom8.Controller.SignInView */
