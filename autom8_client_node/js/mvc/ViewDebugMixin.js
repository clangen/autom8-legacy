(function() {
  var debug = {
    enabled: true,
    alive: 0,
    created: 0,
    destroyed: 0,
    paused: 0,
    resumed: 0,
    log: function() {
      var message =
        'created: ' + this.created +
        ', destroyed: ' + this.destroyed +
        ', paused: ' + this.paused + ' ' +
        ' (' + Math.round(this.paused / this.alive * 100) + '%)' +
        ', resumed: ' + this.resumed + ' ' +
        ' (' + Math.round(this.resumed / this.alive * 100) + '%)' +
        ', paused+resumed: ' + (this.paused + this.resumed) +
        ', alive: ' + this.alive;

      console.log(message);
    }
  };

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
          debug.paused--;
          debug.log();
        }
      }
    }
  };
}());