(function() {
  namespace("autom8.mvc.mixins").ControllerContainer = {
    'prototype': {
      addChild: function(controller, options) {
        options = options || { };
        if (controller.parent) {
          throw new Error("controller already has a parent");
        }

        controller.parent = this;
        this.controllers.push(controller);

        if (options.resume !== false) {
          controller.resume();
        }

        return controller;
      },

      removeChild: function(controller, options) {
        if (controller.parent !== this) {
          throw new Error("cannot remove a controller that's not a child");
        }

        this.children = _.without(controller);
        controller.parent = null;

        if (options.destroy !== false) {
          controller.destroy();
        }
        else if (options.pause !== false) {
          controller.pause();
        }

        return controller;
      },

      clearChildren: function(options) {
        options = options || { };
        var self = this;

        _.each(this.controllers, function(controller) {
          controller.parent = null;

          if (options.destroy !== false) {
            controller.destroy();
          }
          else if (options.pause !== false) {
            controller.pause();
          }
        });

        this.controllers = [];
      }
    },

    'lifecycle': {
      onCreate: function(options) {
        this.controllers = [];
      },

      onResume: function(options) {
        _.invoke(this.controllers, 'resume', options);
      },

      onPause: function(options) {
        _.invoke(this.controllers, 'pause', options);
      },

      onDestroy: function(options) {
        _.invoke(this.controllers, 'destroy', options);
        this.controllers = [];
      }
    }
  };
}());