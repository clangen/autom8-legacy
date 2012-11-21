namespace("autom8.view").HeaderView = (function() {
  var View = autom8.mvc.View;

  return View.extend({
    events: {
      "touch .header-button": function() {
        this.trigger("signout:clicked");
      }
    },

    onCreate: function(options) {
      options = options || { };
      this.setElement(View.elementFromTemplateId('autom8-View-HeaderView'));
      this.setState("unrecognized");
    },

    setState: function(state) {
      /* remove old substates */
      this.$el.removeClass('unrecognized');

      this.$('#status').html('autom8.');
      this.$('#hostname').html(window.location.hostname);

      switch (state) {
        case "connecting":
          this.$('.header-host-separator').html('refreshing');
          break;

        case "connected":
          this.$('.header-host-separator').html('controlling');
          break;

        case "disconnected":
          this.$('.header-host-separator').html('connecting to');
          break;

        case "unrecognized":
          this.$el.addClass('unrecognized');
          this.$('.header-host-separator').html('welcome to');
          break;
      }
    }
  });
}());
