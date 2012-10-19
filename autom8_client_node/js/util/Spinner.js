autom8.Spinner = (function() {
  var options = {
    lines: 10,
    length: 2,
    width: 2,
    radius: 6,
    corners: 1,
    rotate: 19,
    color: '#fff',
    speed: 1,
    trail: 74,
    shadow: true
  };

  return {
    create: function(id) {
      var el = document.getElementById(id);
      var spinner = new Spinner(options);

      return {
        start: function() {
          spinner.spin(el);
        },

        stop: function() {
          spinner.stop();
        },

        get: function() {
          return spinner;
        }
      };
    }
  };
}());