 (function() {
  var View = autom8.mvc.View;

  var DeviceListView = View.extend({
    template: 'autom8-View-Devices',

    events: {
    },

    onCreate: function(options) {
      this.update(this);
    },

    update: function(model) {
      var $list = this.$el.find('.list');

      if (!model) {
        $list.empty();
        this.model = null;
        return;
      }

      this.model = model;

      if (model.devices) {
        for (var i = 0; i < model.devices.length; i++) {
          var row = new View({
            className: i % 2 == 0 ? 'even' : 'odd',
            tagName: 'li',
            template: 'autom8-View-DeviceRow',
            templateParams: model.devices[i]
          });

          this.addChild(row, {appendToElement: $list});
        }
      }
    }
  });

  namespace("autom8.view").DeviceListView = DeviceListView;
}());
