(function() {
  var __super__ = Backbone.View.prototype;

  var View = Backbone.View.extend({
    mixins: [
      autom8.mvc.mixins.ViewInflater, 
      autom8.mvc.mixins.Touchable
    ],

    initialize: function(options) {
      Backbone.View.prototype.initialize.apply(this, arguments);
      this.create(options);
    },

    create: function(options) {
      this.applyStateChange('create', options);
      this.destroyed = false;
      this.paused = true;
      return this;
    },

    resume: function(options) {
      this.applyStateChange('resume', options, function() {
        this.delegateEvents();
      });

      this.paused = false;
      return this;
    },

    pause: function() {
      this.applyStateChange('pause', options, function() {
        this.undelegateEvents();
      });

      this.paused = true;
      return this;
    },

    destroy: function(options) {
      if (!this.paused) {
        this.pause(options);
      }

      this.applyStateChange('destroy', options);
      this.destroyed = true;
      return this;
    },

    delegateEvents: function(events) {
      __super__.delegateEvents.call(this, events);
      this.applyStateChange('delegateEvents', events || this.events);
    },

    undelegateEvents: function() {
      __super__.undelegateEvents.call(this);
      this.applyStateChange('undelegateEvents');
    },

    render: function(options) {
      this.applyStateChange('render', options);
      return this;
    }
  });

  _.extend(View.prototype, autom8.mvc.Lifecycle.prototype);
  View.extend = autom8.mvc.Lifecycle.extend;

  autom8.mvc.View = View;
}());