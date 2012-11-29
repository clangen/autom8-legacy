namespace("autom8.view").SignInView = (function() {
  var View = autom8.mvc.View;

  var clientStateToViewState = {
    'authenticating': 'loading',
    'authenticated': 'loading',
    'connecting': 'loading',
    'connected': 'loaded',
    'disconnected': 'error',
    'expired': 'unrecognized'
  }

  return View.extend({
    events: {
      "keydown": function(e) {
        if (e.keyCode == 13) {
          this.trigger("return:pressed", this.$("#password").val());
        }
      }
    },

    onCreate: function(options) {
      this.passwordRow = this.addChild(new View({el: View.elementFromTemplateId('autom8-View-PasswordRow')}));
      this.spinnerRow = this.addChild(new autom8.view.SpinnerView());
      this.setState("initialized");
    },

    setState: function(state) {
      state = clientStateToViewState[state] || 'unrecognized';

      if (state === this.state) {
        return;
      }

      this.state = state;

      switch (state) {
        case "loading":
        case "loaded":
          this.passwordRow.hide();
          this.spinnerRow.start();
          break;

        case 'error':
        case 'unrecognized':
        default:
          this.spinnerRow.stop();
          this.passwordRow.show();
          
          /* focus is more reliable if we defer after show */
          _.defer(function() {
            this.$("#password").focus();
          }, this);
          break;
      }
    }
  });
}());
