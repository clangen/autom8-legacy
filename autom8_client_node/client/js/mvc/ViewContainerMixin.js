(function() {
  function applyStateChange(context, name, view, options) {
    options = _.extend({ }, options);
    options.view = view;
    context.applyStateChange(name, options);
  }

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

        if (options.resume !== false && !this.paused && view.paused) {
          view.resume(options.resumeOptions);
        }

        if (options.appendToElement && view.$el) {
          if (_.isString(options.appendToElement)) {
            options.appendToElement = this.$(options.appendToElement).eq(0);
          }

          options.appendToElement.append(view.$el);
        }
        else if (options.appendBeforeElement && view.$el) {
          if (_.isString(options.appendBeforeElement)) {
            options.appendBeforeElement = this.$(options.appendBeforeElement).eq(0);
          }

          options.appendBeforeElement.before(view.$el);
        }
        else if (options.appendAfterElement && view.$el) {
          if (_.isString(options.appendAfterElement)) {
            options.appendAfterElement = this.$(options.appendAfterElement).eq(0);
          }

          options.appendAfterElement.after(view.$el);
        }
        else if ((options.append !== false) && this.$el && view.$el) {
          this.$el.append(view.$el);
        }

        if (options.addClass) {
          view.$el.addClass(options.addClass);
        }

        this.views.push(view);
        view.parent = this;

        applyStateChange(this, 'addChild', view, options);

        return view;
      },

      destroyChild: function(view, options) {
        options = options || { };
        options.destroy = true;
        this.removeChild(view, options);
      },

      removeChild: function(view, options) {
        options = options || { };

        if (!view) {
          return;
        }

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

        applyStateChange(this, 'removeChild', view, options);

        return view;
      },

      clearChildren: function(options) {
        options = options || { };
        var self = this;

        if (options.destroy === undefined) {
          options.destroy = true;
        }

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
        options = options || { };
        if (options.recurse !== false) {
          _.invoke(this.views, 'resume', options);
        }
      },

      onPause: function(options) {
        options = options || { };
        if (options.recurse !== false) {
          _.invoke(this.views, 'pause', options);
        }
      },

      onDestroy: function(options) {
        options = options || { };
        if (options.recurse !== false) {
          _.invoke(this.views, 'destroy', options);
        }

        this.views = [];
      }
    }
  };
}());