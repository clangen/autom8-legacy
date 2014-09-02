 (function() {
  var View = autom8.mvc.View;

  var redraw = function() {
    var model = this.systemModel;
    var running = model.get('running');
    this.$('.button').removeClass('disabled');
    this.$(running ? '.start' : '.stop').addClass('disabled');
    this.$('.stop-message').toggleClass('disabled', !running);
    this.$('.connection').toggleClass('connected', running);
    this.$el.removeClass('updating');
  };

  var updating = function(c) {
    return c.$el.hasClass('updating');
  };

  var ServerControlView = View.extend({
    template: 'autom8-View-ButtonRow',

    events: {
      'touch .button.start': function(e) {
        if (!updating(this) && !this.systemModel.get('running')) {
          this.trigger('start:clicked');
        }
      },

      'touch .button.stop': function(e) {
        if (!updating(this) && this.systemModel.get('running')) {
          this.trigger('stop:clicked');
        }
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
