(function() {
  var debug = {
    enabled: true,
    debounce: 1000,
    alive: 0,
    created: 0,
    destroyed: 0,
    paused: 0,
    resumed: 0,
    log: function() {
      var message =
        'c: ' + this.created +
        '\t\td: ' + this.destroyed +
        '\t\tp: ' + this.paused + ' ' +
        ' (' + Math.round(this.paused / this.alive * 100) + '%)' +
        '\t\tr: ' + this.resumed + ' ' +
        ' (' + Math.round(this.resumed / this.alive * 100) + '%)' +
        '\t\tp + r: ' + (this.paused + this.resumed) +
        '\t\ta: ' + this.alive +
        '\t\to: ' + ((this.created - this.destroyed) - this.alive);

      console.log(message);
    }
  };

  debug.log = debug.debounce ? _.debounce(debug.log, debug.debounce) : debug.log;

  namespace("autom8.mvc.mixins").ViewDebug = {
    'lifecycle': {
      onCreate: function(options) {
        if (debug.enabled) {
          debug.created++;
          debug.alive++;
          debug.paused++;
          debug.log();
        }
      },

      onResume: function(options) {
        if (debug.enabled) {
          debug.paused--;
          debug.resumed++;
          debug.log();
        }
      },

      onPause: function(options) {
        if (debug.enabled) {
          debug.paused++;
          debug.resumed--;
          debug.log();
        }
      },

      onDestroy: function(options) {
        if (debug.enabled) {
          debug.destroyed++;
          debug.alive--;
          /* View.destroy() assures views are paused before
          they are destroyed, so the pause count will be
          incremented */
          debug.paused--;
          debug.log();
        }
      }
    }
  };
}());