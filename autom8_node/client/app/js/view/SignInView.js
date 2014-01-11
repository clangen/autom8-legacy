namespace("autom8.view").SignInView = (function() {
  var View = autom8.mvc.View;

  var clientStateToViewState = {
    'authenticating': 'loading',
    'authenticated': 'loading',
    'connecting': 'loading',
    'connected': 'loading',
    'disconnected': 'idle',
    'expired': 'idle'
  };

  function trigger(c) {
    var val = c.$("#password").val();
    if (val) {
      c.trigger("return:pressed", val);
    }
  }

  return View.extend({
    className: 'sign-in-activity',

    events: {
      "keydown": function(e) {
        if (e.keyCode == 13) {
          trigger(this);
        }
      },
      "touch .sign-in-button-touch-area": function() {
        trigger(this);
      }
    },

    onCreate: function(options) {
      this.passwordRow = this.addChild(new View({el: View.elementFromTemplateId('autom8-View-PasswordRow')}));

      this.spinnerRow = this.addChild(new autom8.view.SpinnerView({
        template: '#autom8-View-LoadingRow',
        spinnerSelector: '.loading-spinner'
      }));
    },

    onResume: function() {
      this.setState(autom8.client.state);
    },

    setState: function(state) {
      state = clientStateToViewState[state] || 'idle';

      /* if we're paused just forget our state and don't do anything.
      when we are resumed we'll redraw */
      if (this.paused) {
        this.state = undefined;
        return;
      }

      if (state === this.state) {
        return;
      }

      switch (state) {
        case 'loading':
          this.passwordRow.$el.addClass('gone');
          this.spinnerRow.start();
          break;

        // case 'idle':
        default:
          this.spinnerRow.stop();
          this.passwordRow.$el.removeClass('gone');
          this.focusPasswordInput(true);
          break;
      }
    },

    focusPasswordInput: function(focus) {
      /* hack to prevent focus problems when dialog is made visible and
      SignInView becomes reactivated */
      if ($("#dialogs").children().length) {
        focus = false;
      }

      var self = this;
      _.defer(function() {
        var pw = self.$('#password');
        if (focus || focus === undefined) {
          pw.focus();
        }
        else {
          pw.blur();
        }
      });
    }
  });
}());
