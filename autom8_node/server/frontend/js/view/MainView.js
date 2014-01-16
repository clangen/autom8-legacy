 (function() {
  var View = autom8.mvc.View;

  var MainView = View.extend({
    events: {
      'touch .button.start': function(e) {
        this.trigger('start:clicked');
      },

      'touch .button.stop': function(e) {
        this.trigger('stop:clicked');
      }
    },

    onBeforeCreate: function(options) {
      this.$el.append(View.elementFromTemplateId('autom8-View-MainView'));
    },

  });

  namespace("autom8.view").MainView = MainView;
}());
