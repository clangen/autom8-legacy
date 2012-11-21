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

      switch (state) {
        case "connecting":
          this.$('#status').html("refreshing...");
          this.$('.header-host-separator').html('');
          this.$('#hostname').html('');
          break;

        case "connected":
          this.$('#status').html('connected');
          this.$('.header-host-separator').html('@');
          this.$('#hostname').html(localStorage[autom8.Prefs.ConnectionName]);
          break;

        case "disconnected":
          this.$('#status').html("disconnected");
          this.$('.header-host-separator').html('');
          this.$('#hostname').empty();
          break;

        case "unrecognized":
          this.$('#status').html('<span style="font-size: 60%"><u>welcome</u> to</span> autom8');
          this.$el.addClass('unrecognized');
          break;
      }
    }
  });
}());
