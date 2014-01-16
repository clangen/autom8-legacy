 (function() {
  var View = autom8.mvc.View;

  var MainView = View.extend({
    events: {
      'touch .restart-button': function(e) {
        this.trigger('restartClicked');
      }
    },

    onBeforeCreate: function(options) {
      this.$el.append(View.elementFromTemplateId('autom8-View-MainView'));
    },

  });

  namespace("autom8.view").MainView = MainView;
}());
