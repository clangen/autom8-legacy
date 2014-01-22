 (function() {
  var View = autom8.mvc.View;

  var redraw = function() {
    var model = this.systemModel;
    this.$('.button').removeClass('disabled');
    this.$(model.get('running') ? '.start' : '.stop').addClass('disabled');
    this.$('.connection').toggleClass('connected', model.get('running'));
  };

  var ServerControlView = View.extend({
    template: 'autom8-View-ButtonRow',

    events: {
      'touch .button.start': function(e) {
        this.trigger('start:clicked');
      },

      'touch .button.stop': function(e) {
        this.trigger('stop:clicked');
      }
    },

    onCreate: function() {
      this.systemModel = autom8.model.SystemModel;
      this.systemModel.on('change', redraw, this);
    },

    onDestroy: function() {
      this.systemModel.off('change', redraw, this);
    }
  });

  namespace("autom8.view").ServerControlView = ServerControlView;
}());
