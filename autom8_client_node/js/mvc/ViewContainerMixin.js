(function() {
  namespace("autom8.mvc.mixins").ViewContainer = {
    'prototype': {
      addChild: function(view, options) {
        options = options || { };

        if (view.parent) {
          throw new Error("view already has a parent");
        }
        else if (view.destroyed) {
          throw new Error("cannot add a destroyed view");
        }

        if (options.resume !== false && view.paused) {
          view.resume(options.resumeOptions);
        }

        if ((options.append !== false) && this.$el && view.$el) {
          this.$el.append(view.$el);
        }
        else if (options.appendToElement && view.$el) {
          options.appendToElement.append(view.$el);
        }
        else if (options.appendBeforeElement && view.$el) {
          options.appendBeforeElement.before(view.$el);
        }
        else if (options.appendAfterElement && view.$el) {
          options.appendAfterElement.after(view.$el);
        }

        this.views.push(view);
        view.parent = this;

        return view;
      },

      removeChild: function(view, options) {
        options = options || { };

        if (view.parent !== this) {
          throw new Error("view is not a subview of this view");
        }

        this.views = _.without(this.views, view);
        view.parent = null;

        if (options.destroy) {
          view.destroy(options.destroyOptions);
        }
        else if (options.pause !== false) {
          view.pause(options.pauseOptions);
        }

        if (options.detach !== false) {
          view.$el.remove();
        }

        return view;
      },

      clearChildren: function(options) {
        options = options || { };
        var self = this;

        _.each(this.views, function(view) {
          self.removeChild(view, options);
        });

        this.views = [];
      }
    },

    'lifecycle': {
      onCreate: function(options) {
        this.views = [];
      },

      onResume: function(options) {
        _.invoke(this.views, 'resume', options);
      },

      onPause: function(options) {
        _.invoke(this.views, 'pause', options);
      },

      onDestroy: function(options) {
        _.invoke(this.views, 'destroy', options);
        this.views = [];
      }
    }
  };
}());