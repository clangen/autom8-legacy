namespace("autom8.controller").DeviceListController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      this.view = new autom8.view.DeviceListView({ el: $('.devices') });
    }
  });
}());