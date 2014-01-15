 (function() {
  var View = autom8.mvc.View;

  var MainView = View.extend({
    events: {
      'touch .restart-button': function(e) {
        var brightness = ($(e.currentTarget).attr('data-value'));
        if (brightness) {
          autom8.util.Device.setLampBrightness(this.device, brightness);
          this.selectClosestButton(brightness);
        }
      }
    },

    onBeforeCreate: function(options) {
      this.setElement(
        autom8.mvc.View.elementFromTemplate('autom8-View-MainView')
        .get(0)
      );
    },

  });

  namespace("autom8.view").MainView = MainView;
}());
