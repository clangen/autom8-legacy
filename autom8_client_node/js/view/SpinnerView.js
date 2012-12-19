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

      if (options.hide) {
        this.hide();
      }

      this.$spinnerEl = this.$el;
      if (options.spinnerSelector) {
        this.$spinnerEl = this.$(options.spinnerSelector) || this.$el;
      }

      this.spinner = new Spinner(options.spinnerOptions);

      if (options.containerClass) {
        this.$el.addClass(options.containerClass);
      }

      if (options.start) {
        this.start();
      }
    },

    start: function(options) {
      options = options || { };
      
      if (options.show !== false) {
        this.show();
      }

      var self = this;
      _.defer(function() {
        self.spinner.spin(self.$spinnerEl.get(0));
      });
    },

    stop: function(options) {
      options = options || { };

      this.spinner.stop();

      if (options.hide !== false) {
        this.hide();
      }
    }
  });
}());
