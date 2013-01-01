(function() {
  var View = autom8.mvc.View;

  namespace("autom8.view").AboutView = View.extend({
    events: {
    },

    onCreate: function(options) {
      var params = {
        host: window.location.host,
        status: autom8.client.connected ? "connected" : "disconnected",
        version: autom8.version
      };

      this.$el.append(View.elementFromTemplateId('autom8-View-AboutView', params));
    }
  });
}());


