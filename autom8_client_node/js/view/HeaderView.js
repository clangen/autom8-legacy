namespace("autom8.view").HeaderView = (function() {
  var View = autom8.mvc.View;

  var HeaderView = View.extend({
    events: {
      "touch #header-button": function() {
        if (this.$el.hasClass('unrecognized')) {
          HeaderView.staticEvents.trigger('signin:clicked');
        }
        else {
          this.trigger("signout:clicked");
        }
      }
    },

    onCreate: function(options) {
      options = options || { };
      this.setElement(View.elementFromTemplateId('autom8-View-HeaderView'));
      this.setState("unrecognized");
    },

    setState: function(state) {
      /* remove old sub-states */
      this.$el.removeClass('unrecognized');

      this.$('#status').html('autom8.');
      this.$('#hostname').html(window.location.hostname);
      this.$('#header-button').html('sign out').show();

      switch (state) {
        case "authenticated":
        case "authenticating":
        case "connecting":
          this.$('.header-host-separator').html('refreshing');
          this.$('#header-button').hide();
          break;

        case "connected":
          this.$('.header-host-separator').html('controlling');
          break;

        case "disconnected":
          this.$('#header-button').html('sign in');
          this.$('.header-host-separator').html('connecting to');
          break;

        case "unrecognized":
          this.$el.addClass('unrecognized');
          this.$('.header-host-separator').html('welcome to');
          this.$('#header-button').html('sign in');
          break;
      }
    }
  });

  HeaderView.staticEvents = _.extend({ }, Backbone.Events);

  return HeaderView;
}());
