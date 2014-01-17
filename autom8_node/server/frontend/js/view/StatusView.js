 (function() {
  var View = autom8.mvc.View;

  var StatusView = View.extend({
    template: 'autom8-View-ServerInfo',

    events: {
    },

    onCreate: function(options) {
      this.update(this);
    },

    update: function(model) {
      model = model || { };

      this.inflate(
        'autom8-View-ServerInfo', {
          controller: model.system_description || model.system_id,
          fingerprint: model.fingerprint,
          port: model.port,
          version: model.version
      });
    }
  });

  namespace("autom8.view").StatusView = StatusView;
}());
