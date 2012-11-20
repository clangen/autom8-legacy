namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.mvc.View({el: $('#main-content')});
      this.headerController = this.addChild(new autom8.controller.HeaderController());
      this.deviceListController = this.addChild(new autom8.controller.DeviceListController());
      this.view.addChild(this.headerController.view);
      this.view.addChild(this.deviceListController.view);
    }
  });
}());