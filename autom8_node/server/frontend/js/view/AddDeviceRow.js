 (function() {
  var View = autom8.mvc.View;

  var AddDeviceRow = View.extend({
    template: 'autom8-View-DeviceRowAddDevice',
    tagName: 'li',

    events: {
    },

    onCreate: function(options) {
    },

    onDestroy: function() {
    }
  });

  namespace("autom8.view").AddDeviceRow = AddDeviceRow;
}());
