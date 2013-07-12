(function() {
  var View = autom8.mvc.View;

  namespace("autom8.view").AboutView = View.extend({
    className: "about-dialog",

    onCreate: function(options) {
      var status =  autom8.client.connected ? "connected" : "disconnected";

      var params = {
        host: window.location.host,
        status: status,
        theme: autom8.Config.display.classes.body || "generic",
        version: autom8.version
      };

      this.$el.append(View.elementFromTemplateId('autom8-View-AboutView', params));
      this.$el.addClass(status);
    }
  });
}());


