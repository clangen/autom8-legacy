 (function() {
  var View = autom8.mvc.View;

  var MainView = View.extend({
    onBeforeCreate: function(options) {
      this.$el.append(View.elementFromTemplateId('autom8-View-MainView'));
    },

    onCreate: function(options) {
      this.serverControlView = new autom8.view.ServerControlView({
        el: $('.server-control')
      });

      this.consoleView = new autom8.view.ConsoleView({
        el: $('.main-content-right')
      });
    }
  });

  namespace("autom8.view").MainView = MainView;
}());
