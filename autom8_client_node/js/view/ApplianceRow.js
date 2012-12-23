namespace("autom8.view").ApplianceRow = (function() {
  var deviceRowTemplate = $("#autom8-View-DeviceRow").html();

  var _super_ = autom8.view.DeviceRow;

  return _super_.extend({
    setDevice: function(device) {
      _super_.prototype.setDevice.call(this, device);
      this.render();
    },

    onRender: function() {
      var address = this.device.get('address');

      var args = {
        rowClass: "",
        buttonClass: "",
        buttonText: "",
        text: this.device.get('label'),
        subtext: ""
      };

      if (this.device.get('type') == autom8.DeviceType.Lamp) {
        args.subtext = "lamp " + address;
      }
      else {
        args.subtext = "appliance " + address;
      }

      if (this.device.get('status') == autom8.DeviceStatus.On) {
        args.buttonClass = "button on";
        args.buttonText = "on";
        args.rowClass = "device-row on";
      }
      else {
        args.buttonClass = "button off";
        args.buttonText = "off";
        args.rowClass = "device-row off";
      }

      this.setElement(autom8.mvc.View.elementFromTemplate(deviceRowTemplate, args));
    }
  });
}());
