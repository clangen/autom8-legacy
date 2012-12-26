(function() {
  function Controller() {
    this.create.apply(this, arguments);
  }

  _.extend(Controller.prototype, Backbone.Events, {
    create: function(options) {
      this.applyStateChange('create', options);
      this.paused = true;
      this.destroyed = false;
      return this;
    },

    resume: function(options) {
      if (!this.paused) {
        return;
      }

      this.applyStateChange('resume', options, function() {
        if (this.view) {
          this.view.resume();
        }
      });

      this.paused = false;
      return this;
    },

    pause: function(options) {
      if (this.paused) {
        return;
      }

      this.applyStateChange('pause', options, function() {
        if (this.view) {
          this.view.pause();
        }
      });

      this.paused = true;
      return this;
    },

    destroy: function(options) {
      this.pause(options.pauseOptions);

      this.applyStateChange('destroy', options, function() {
        if (this.view) {
          this.view.destroy();
        }
      });

      this.destroyed = true;
      return this;
    }
  });

  Controller.extend = autom8.mvc.Lifecycle.extend;
  _.extend(Controller.prototype, autom8.mvc.Lifecycle.prototype);

  namespace("autom8.mvc").Controller = Controller;
}());