(function() {
  var View = Backbone.View.extend({
    initialize: function(options) {
      Backbone.View.prototype.initialize.apply(this, arguments);
      this.create(options);
    },

    create: function(options) {
      this.applyStateChange('create', options);
      return this;
    },

    resume: function(options) {
      this.applyStateChange('resume', options, function() {
        this.delegateEvents();
      });

      return this;
    },

    pause: function() {
      this.applyStateChange('pause', options, function() {
        this.undelegateEvents();
      });

      return this;
    },

    destroy: function(options) {
      this.applyStateChange('destroy', options);
      return this;
    },
  });

  _.extend(View.prototype, autom8.mvc.Lifecycle.prototype);
  View.extend = Backbone.View.extend;

  autom8.mvc.View = View;
}());