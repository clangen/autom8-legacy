;(function() {
  function Timer(label) {
    this.label = label || "[no label]";
    this.startTime = new Date().getTime();
  }

  Timer.prototype.start = function() {
    this.startTime = new Date().getTime();
  };

  Timer.prototype.end = function() {
    this.endTime = new Date().getTime();
    console.log(this.label + ': ' + (this.endTime - this.startTime) + "ms");
  };

  namespace('autom8.util').Timer = Timer;
}());