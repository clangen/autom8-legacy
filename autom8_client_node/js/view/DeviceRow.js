namespace("autom8.view").DeviceRow = (function() {
  var View = autom8.mvc.View;

  var deviceRow = View.extend({
    setDevice: function(device) {
      if (device === this.device) {
        return;
      }

      if (this.device) {
        this.device.off('change:updating', this.onDeviceChange, this);
      }

      this.device = device;

      if (device) {
        device.on('change:updating', this.onDeviceChange, this);
      }
    },

    onDeviceChange: function() {
      if (this.spinner && this.device) {
        if (this.device.get('updating')) {
          this.spinner.start();
        }
        else {
          this.spinner.stop();
        }
      }
    },

    onDestroy: function(options) {
      if (this.device) {
        this.device.off('change:updating', this.onDeviceChange, this);
      }

      this.device = null;
    }
  });

  deviceRow.createSpinner = function(options) {
    options = options || { };

    return new autom8.view.SpinnerView({
      el: $('<div class="row-spinner-container"></div>'),
      spinnerSelector: null,
      spinnerOptions: {
        radius: options.radius || 6,
        className: 'row-spinner'
      }
    });
  };

  return deviceRow;
}());
