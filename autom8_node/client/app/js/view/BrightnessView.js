 (function() {
  var View = autom8.mvc.View;

  var BrightnessView = View.extend({
    events: {
      'touch .brightness-button': function(e) {
        var brightness = ($(e.currentTarget).attr('data-value'));
        if (brightness) {
          autom8.util.Device.setLampBrightness(this.device, brightness);
          this.selectClosestButton(brightness);
        }
      }
    },

    onCreate: function(options) {
      this.device = options.device;

      this.$el.append(View.elementFromTemplateId('autom8-View-LampBrightness'));

      if (this.device.get('status') !== autom8.DeviceStatus.Off) {
        var brightness = Number(this.device.get('attrs').brightness);
        this.selectClosestButton(brightness);
      }
    },

    selectClosestButton: function(brightness) {
      var buttons = this.$('.brightness-button');
      var closest = (buttons.length/100 * brightness) - 1;

      if (closest >= 0 && closest < buttons.length) {
        buttons.removeClass('selected');
        $(buttons[closest]).addClass('selected');
      }
    }
  });

  BrightnessView.showDialogForLamp = function(device) {
    var onDisconnected = function() {
      dialog.close();
    };

    autom8.client.on('disconnected', onDisconnected);

    var dialog = autom8.util.Dialog.show({
      title: "Adjust brightness",
      message: "\n",
      icon: autom8.util.Dialog.Icon.Information,
      view: new autom8.view.BrightnessView({device: device}),
      buttons: [
        {
          caption: "ok",
          callback: null,
          negative: true
        }
      ],
      onClosed: function() {
        autom8.client.off('disconnected', onDisconnected);
      }
    });
  };

  namespace("autom8.view").BrightnessView = BrightnessView;
}());
