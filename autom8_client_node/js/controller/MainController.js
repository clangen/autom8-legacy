namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    resetMainController: function(ControllerType) {
      ControllerType = ControllerType || autom8.controller.DeviceListController;

      if (this.mainController) {
        this.mainController.destroy();
      }

      this.mainController = this.addChild(new ControllerType());
      this.mainController.resume();

      this.view.clearChildren();
      this.view.addChild(this.mainController.view);
    },

    onCreate: function(options) {
      autom8.client.on('connected', this.onConnected, this);
      autom8.client.on('disconnected', this.onDisconnected, this);

      this.view = new autom8.mvc.View({el: $("#main-content")});

      this.headerController = new autom8.controller.HeaderController();
      this.resetMainController();
    },

    onDestroy: function() {
      autom8.client.off('connected', this.onConnected, this);
      autom8.client.off('disconnected', this.onDisconnected, this);
    },

    onConnected: function() {
      this.resetMainController();
    },

    onDisconnected: function(reason) {
      alert("what " + reason);
    }
  });
}());