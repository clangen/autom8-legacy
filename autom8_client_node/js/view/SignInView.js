namespace("autom8.view").SignInView = (function() {
  var View = autom8.mvc.View;

  var headerOptions = {
    headerType: 'sign-in',
    headerParams: { 
      headerText: 'welcome to <b>autom8</b>'
    }
  };

  return View.extend({
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
      this.headerView = this.addChild(new autom8.view.HeaderView(headerOptions));
      this.headerView.setState("unrecognized");

      this.passwordRow = this.addChild(new View({el: View.elementFromTemplateId('autom8-View-PasswordRow')}));
      this.spinnerRow = this.addChild(new autom8.view.SpinnerView());
      this.setState("initialized");
    },

    setState: function(state) {
      switch (state) {
        case "loading":
          this.passwordRow.hide();
          this.spinnerRow.start();
          break;

        case "error":
          this.passwordRow.show();
          this.spinnerRow.stop();

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
          this.spinnerRow.stop();
          this.passwordRow.show();
          $("#password").focus();
          break;
      }
    }
  });
}());
