(function() {
  var View = autom8.mvc.View;

  var spinnerOptions = {
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

  namespace("autom8.view").SpinnerView = View.extend({
    onCreate: function(options) {
      /* make a copy because we're going to mutate it */
      options = _.extend({ }, options) || { };

      options.spinnerSelector = options.spinnerSelector;

      options.spinnerOptions = _.extend(
        { }, spinnerOptions, options.spinnerOptions);

      if (options.template) {
        this.$el.append(View.elementFromTemplateId(
          options.template, options.templateParams || { }));
      }

      this.$spinnerEl = this.$el;
      if (options.spinnerSelector) {
        this.$spinnerEl = this.$(options.spinnerSelector) || this.$el;
      }

      this.spinner = new Spinner(options.spinnerOptions);

      if (options.containerClass) {
        this.$el.addClass(options.containerClass);
      }

      this.state = "disabled";

      if (options.start) {
        this.start();
      }
    },

    onResume: function() {
      if (this.state === "suspended") {
        this.start();
      }
    },

    onPause: function() {
      if (this.state === "running") {
        this.stop();

        /* it's important to set the suspended state after we
        stopped, that way the next time we're resumed we start
        spinning again */
        this.state = "suspended";
      }
    },

    spin: function(start) {
      if (start === true || start === undefined) {
        this.start();
      }
      else if (start === false) {
        this.stop();
      }
    },

    start: function() {
      if (this.paused) {
        this.state = "suspended";
        return;
      }

      this.stop();
      this.state = "running";
      this.show();

      var self = this;
      _.defer(function() {
        self.spinner.spin(self.$spinnerEl.get(0));
        self.$el.parent().addClass('spinning');
      });
    },

    stop: function() {
      this.state = "stopped";
      this.spinner.stop();
      this.$el.parent().removeClass('spinning');
      this.hide();
    }
  });
}());
