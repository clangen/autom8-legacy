(function() {
  function Lifecycle() {
  }

  _.extend(Lifecycle.prototype, {
    applyStateChange: function(name, args, func) {
      name = name.charAt(0).toUpperCase() + name.slice(1);

      var order = [
        { func: this['onBefore' + name] },
        { func: func },
        { func: this['on' + name] },
        { func: this['onAfter' + name], defer: true }
      ];

      if (args && !_.isArray(args)) {
        args = [args];
      }

      var self = this;

      _.each(order, function(f) {
        if (f && _.isFunction(f.func)) {
          if (f.defer) {
            _.defer(function() {
              f.func.apply(self, args);
            });
          }
          else {
            f.func.apply(self, args);
          }
        }
      });      
    }
  });

  autom8.mvc.Lifecycle = Lifecycle;
}());