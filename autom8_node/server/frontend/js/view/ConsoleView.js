 (function() {
  var View = autom8.mvc.View;

  var ConsoleView = View.extend({
    template: 'autom8-View-Console',

    events: {
    },

    onCreate: function(options) {
      this.update();
    },

    update: function(model) {
    }
  });

  namespace("autom8.view").ConsoleView = ConsoleView;
}());
