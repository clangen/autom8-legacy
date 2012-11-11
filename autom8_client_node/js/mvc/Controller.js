(function() {
  function Controller() {
    this.create.apply(this, arguments);
  }

  _.extend(Controller.prototype, {
    create: function(options) {
      this.applyStateChange('create', options);
      return this;
    },

    resume: function(options) {
      this.applyStateChange('resume', options, function() {
        if (this.view) {
          this.view.resume();
        }
      });
      return this;
    },

    pause: function(options) {
      this.applyStateChange('pause', options, function() {
        if (this.view) {
          this.view.pause();
        }
      });
      return this;
    },

    destroy: function(options) {
      this.applyStateChange('destroy', options, function() {
        if (this.view) {
          this.view.destroy();
        }
      });
      return this;
    },
  });

  Controller.extend = Backbone.View.extend;
  _.extend(Controller.prototype, autom8.mvc.Lifecycle.prototype);

  autom8.mvc.Controller = Controller;
}());