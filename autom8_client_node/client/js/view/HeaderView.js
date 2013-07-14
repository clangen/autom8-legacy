namespace("autom8.view").HeaderView = (function() {
  var View = autom8.mvc.View;

  function showSignOutConfirmationDialog(context, options) {
    options = options || { };

    autom8.util.Dialog.show({
      title: 'autom8',
      message: 'Are you sure you want to sign out?',
      cancelable: true,
      buttons: [
        {
          caption: 'yes',
          positive: true,
          callback: _.bind(function() {
            context.trigger("signout:clicked");
          }, this)
        },
        {
          caption: 'no',
          negative: true,
          callback: function() {
            if (options.onCancel()) {
              options.onCancel();
            }
          }
        }
      ]
    });
  }

  function showAboutDialog(context) {
    var dialog;

    var aboutView = new autom8.view.AboutView({
      events: {
        "touch .sign-out": function(e) {
          dialog.close();
          showSignOutConfirmationDialog(context);
        }
      }
    });

    dialog = autom8.util.Dialog.show({
      title: 'autom8',
      view: aboutView,
      cancelable: true,
      buttons: [
        {
          caption: 'close',
          positive: true,
          negative: true
        }
      ]
    });
  }

  var HeaderView = View.extend({
    events: {
      "touch .header-about": function() {
        showAboutDialog(this);
      }
    },

    onCreate: function(options) {
      options = options || { };
      this.$el.append(View.elementFromTemplateId('autom8-View-HeaderView'));
      this.setState("unrecognized");
    },

    setState: function(state) {
      /* remove old sub-states */
      if (this.state === state) {
        return;
      }

      if (this.state) {
        this.$el.removeClass(this.state);
      }

      this.state = state;
      this.$el.addClass(this.state);
      this.$('#hostname').html(window.location.hostname);
      this.$('#header-button').html('sign in');

      var aboutText = '?';

      switch (state) {
        case "authenticated":
        case "authenticating":
        case "connecting":
          this.$('.header-host-separator').html('connecting to');
          break;

        case "connected":
          this.$('#header-button').html('sign out')
          this.$('.header-host-separator').html('controlling');
          aboutText = '✔';
          break;

        case "disconnected":
        case "expired":
          this.$('.header-host-separator').html('welcome to');
          break;
      }

      this.$('.header-about').html(aboutText);
    }
  });

  HeaderView.staticEvents = _.extend({ }, Backbone.Events);

  return HeaderView;
}());
