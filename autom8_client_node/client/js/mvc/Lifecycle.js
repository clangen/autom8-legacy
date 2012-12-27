(function() {
  function applyOrDefer(context, func, args, defer) {
    if (defer) {
      _.defer(function() {
        func.apply(context, args);
      });
    }
    else {
      func.apply(context, args);
    }
  }

  function Lifecycle() {
  }

  _.extend(Lifecycle.prototype, {
    applyStateChange: function(name, args, func) {
      name = name.charAt(0).toUpperCase() + name.slice(1);

      var order = [
        { name: 'onBefore' + name },
        { func: func },
        { name: 'on' + name },
        { name: 'onAfter' + name, defer: true }
      ];

      /* make sure args is always an array so we can apply() it */
      if (args && !_.isArray(args)) {
        args = [args];
      }

      var self = this;

      _.each(order, function(f) {
        /* lifecycle mixins get the first crack at the event */
        if (f.name) {
          _.each(self.lifecycles, function(lifecycle) {
            var lf = lifecycle[f.name];
            if (_.isFunction(lf)) {
              applyOrDefer(self, lf, args, f.defer);
            }
          });
        }

        /* if specified by name, find the actual method */
        if (!f.func && f.name) {
          f.func = self[f.name];
        }

        /* call the method on the instance */
        if (_.isFunction(f.func)) {
          applyOrDefer(self, f.func, args, f.defer);
        }
      });
    }
  });

  var origExtend = Backbone.View.extend;

  var extend = function(protoProps, classProps) {
    var extended = origExtend.call(this, protoProps, classProps);

    if (_.isArray(extended.prototype.mixins)) {
      var lifecycles = [];

      _.each(extended.prototype.mixins, function(mixin) {
        if (_.isObject(mixin)) {
          _.extend(extended.prototype, mixin['prototype'] || { });
          _.extend(extended, mixin['class'] || { });

          if (mixin['lifecycle']) {
            lifecycles.push(mixin['lifecycle']);
          }
        }
      });

      /* if we already have lifecycles, append otherwise, assign */
      var current = extended.prototype.lifecycles;

      /* _.uniq() is n^2 in this case, we should be able to do better */
      extended.prototype.lifecycles =
        current ? _.uniq(current.concat(lifecycles)) : lifecycles;
    }

    return extended;
  };

  Lifecycle.extend = Backbone.View.extend = extend;
  namespace("autom8.mvc").Lifecycle = Lifecycle;
}());