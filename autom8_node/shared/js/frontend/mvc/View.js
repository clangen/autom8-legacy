(function() {
  var __super__ = Backbone.View.prototype;

  var View = Backbone.View.extend({
    mixins: [
      // autom8.mvc.mixins.ViewDebug,
      autom8.mvc.mixins.ViewInflater,
      autom8.mvc.mixins.ViewContainer,
      autom8.mvc.mixins.Touchable
    ],

    initialize: function(options) {
      options = options || { };
      this.instanceEvents = options.events || { };
      Backbone.View.prototype.initialize.apply(this, arguments);
      this.create(options);
    },

    create: function(options) {
      this.options = options;

      this.applyStateChange('create', options);
      this.destroyed = false;
      this.paused = true;
      this.hidden = false;
      return this;
    },

    resume: function(options) {
      if (!this.paused) {
        return this;
      }

      this.paused = false;

      this.applyStateChange('resume', options, function() {
        this.delegateEvents();
      });

      return this;
    },

    pause: function(options) {
      if (this.paused) {
        return this;
      }

      this.paused = true;

      this.applyStateChange('pause', options, function() {
        this.undelegateEvents();
      });

      return this;
    },

    destroy: function(options) {
      if (this.destroyed) {
        return this;
      }

      if (!this.paused) {
        this.pause(options);
      }

      this.applyStateChange('destroy', options);
      this.destroyed = true;

      if (this.$el) {
        this.$el.empty();
      }

      return this;
    },

    delegateEvents: function(events) {
      /* delegate all events from the prototype, the instance, and
      the specified hash */
      events = _.extend({ }, this.events, this.instanceEvents, events);

      /* state change first so mixins can pull events from the hash
      before the raw Backbone View delegates the events */
      this.applyStateChange('delegateEvents', events);

      /* start hack: super always calls undelegateEvents - however, the
      mixins just finished their delegation. this flag prevents calling the
      mixins' undelegateEvents during super delegation */
      this.__delegating = true;
      __super__.delegateEvents.call(this, events);
      this.__delegating = false;
    },

    undelegateEvents: function() {
      __super__.undelegateEvents.call(this);

      /* end hack, see above... */
      if (!this.__delegating) {
        this.applyStateChange('undelegateEvents');
      }
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