(function() {
  var __super__ = Backbone.View.prototype;

  var View = Backbone.View.extend({
    mixins: [
      autom8.mvc.mixins.ViewInflater, 
      autom8.mvc.mixins.ViewContainer,
      autom8.mvc.mixins.Touchable,
    ],

    initialize: function(options) {
      options = options || { };
      this.instanceEvents = options.events || { };
      Backbone.View.prototype.initialize.apply(this, arguments);
      this.create(options);
    },

    create: function(options) {
      this.applyStateChange('create', options);
      this.destroyed = false;
      this.paused = true;
      this.hidden = false;
      return this;
    },

    resume: function(options) {
      this.applyStateChange('resume', options, function() {
        this.delegateEvents();
      });

      this.paused = false;
      return this;
    },

    pause: function(options) {
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
      /* delegate all events from the prototype, the instance, and
      the specified hash */
      events = _.extend({ }, this.events, this.instanceEvents, events);

      __super__.delegateEvents.call(this, events);
      this.applyStateChange('delegateEvents', events || this.events);
    },

    undelegateEvents: function() {
      __super__.undelegateEvents.call(this);
      this.applyStateChange('undelegateEvents');
    },

    hide: function(options) {
      this.applyStateChange('hide', options, function() {
        this.$el.hide();
      });

      this.hidden = true;
    },

    show: function(options) {
      this.applyStateChange('show', options, function() {
        this.$el.show();
      });
    },

    render: function(options) {
      this.applyStateChange('render', options);
      return this;
    }
  });

  _.extend(View.prototype, autom8.mvc.Lifecycle.prototype);
  View.extend = autom8.mvc.Lifecycle.extend;

  namespace("autom8.mvc").View = View;
}());