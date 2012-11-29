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
      this.$('#header-button').html('sign out').show();

      switch (state) {
        case "authenticated":
        case "authenticating":
        case "connecting":
          this.$('.header-host-separator').html('connecting to');
          this.$('#header-button').hide();
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
