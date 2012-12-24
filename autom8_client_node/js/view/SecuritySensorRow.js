namespace("autom8.view").SecuritySensorRow = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();

  var _super_ = autom8.view.DeviceRow;

  return _super_.extend({
    setDevice: function(device) {
      _super_.prototype.setDevice.call(this, device);
      this.render();
    },

    onRender: function() {
      var device = this.device;
      var address = device.address();
      var tripped = device.isTripped();
      var armed = device.isArmed();
      var on = device.isOn();
      var rowClass = 'device-row off';

      var args = {
        action: "",
        buttonText: "",
        buttonClass: "",
        text: device.get('label'),
        subtext: "security sensor " + address
      };

      if (on && tripped) {
        args.buttonClass = "button alert";
        args.buttonText = "alert";
        rowClass = "device-row alert";
      }
      else if (armed) {
        args.buttonClass = "button on";
        args.buttonText = "armed";
        rowClass = "device-row on";
      }
      else {
        args.buttonClass = "button off";
        args.buttonText = "off";
      }

      this.$el.empty();
      this.$el.attr('class', rowClass);
      this.$el.append(autom8.mvc.View.elementFromTemplate(deviceRowTemplate, args));
      this.appendSpinner();
    }
  });
}());