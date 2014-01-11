(function() {
  function Controller() {
    this.create.apply(this, arguments);
  }

  _.extend(Controller.prototype, Backbone.Events, {
    create: function(options) {
      this.paused = true;
      this.destroyed = false;
      this.applyStateChange('create', options);
      return this;
    },

    resume: function(options) {
      if (!this.paused) {
        return;
      }

      this.applyStateChange('resume', options, function() {
        this.paused = false;

        if (this.view) {
          this.view.resume();
        }
      });

      return this;
    },

    pause: function(options) {
      if (this.paused) {
        return;
      }

      this.applyStateChange('pause', options, function() {
        this.paused = true;

        if (this.view) {
          this.view.pause();
        }
      });

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