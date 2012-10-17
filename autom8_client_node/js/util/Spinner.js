autom8.Spinner = (function() {
  var options = {
    lines: 10, // The number of lines to draw
    length: 2, // The length of each line
    width: 2, // The line thickness
    radius: 6, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 19, // The rotation offset
    color: '#fff', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 74, // Afterglow percentage
    shadow: true // Whether to render a shadow
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