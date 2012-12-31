namespace("autom8.view").HeaderView = (function() {
  var View = autom8.mvc.View;

  var HeaderView = View.extend({
    events: {
      "touch #header-button": function() {
        if (this.state === 'expired' || this.state === 'disconnected') {
          HeaderView.staticEvents.trigger('signin:clicked');
        }
        else {
          this.trigger("signout:clicked");
        }
      },

      "touch .header-logo": function() {
        autom8.util.Dialog.show({
          title: 'autom8',
          view: new autom8.view.AboutView(),
          cancelable: true,
          buttons: [
            {
              caption: 'ok',
              positive: true,
              negative: true
            }
          ]
        });
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
      this.$('#hostname').html(/*window.location.hostname*/"ricochet.autom8.io");
      this.$('#header-button').html('sign out');

      switch (state) {
        case "authenticated":
        case "authenticating":
        case "connecting":
          this.$('.header-host-separator').html('connecting to');
          break;

        case "connected":
          this.$('.header-host-separator').html('controlling');
          break;

        case "disconnected":
        case "expired":
          this.$('.header-host-separator').html('welcome to');
          this.$('#header-button').html('sign in');
          break;
      }
    }
  });

  HeaderView.staticEvents = _.extend({ }, Backbone.Events);

  return HeaderView;
}());
