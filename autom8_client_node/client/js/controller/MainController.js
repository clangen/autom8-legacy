namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    resetMainController: function() {
      var controller;

      switch(autom8.client.state) {
        case 'expired':
        case 'disconnected':
          controller = this.signInController;
          break;

        case 'connected':
          controller = this.deviceHomeController;
          break;
      }

      if (!controller) {
        this.spinnerView.start();
        autom8.client.connect({silent: true});
        return;
      }

      if (controller === this.mainController) {
        return;
      }

      this.spinnerView.stop();

      if (this.mainController) {
        this.view.removeChild(this.mainController.view, {destroy: false});
        this.removeChild(this.mainController, {destroy: false});
      }

      this.mainController = this.addChild(controller);
      this.view.addChild(controller.view);
    },

    onCreate: function(options) {
      autom8.client.on('connected', this.resetMainController, this);
      autom8.client.on('disconnected', this.resetMainController, this);
      autom8.client.on('expired', this.resetMainController, this);

      this.view = new autom8.mvc.View({el: $("#main-content")});
      
      this.spinnerView = new autom8.view.SpinnerView({
        el: $('#spinner-view'),
        template: '#autom8-View-LoadingRow',
        spinnerSelector: '.loading-spinner',
        start: true
      });

      this.headerController = this.addChild(new autom8.controller.HeaderController());

      this.messagingController = this.addChild(new autom8.controller.ConnectionMessagingController());
      this.messagingController.on('dialog:opened', this.onDialogOpened, this);
      this.messagingController.on('dialog:closed', this.onDialogClosed, this);

      this.signInController = new autom8.controller.SignInController();
      this.deviceHomeController = new autom8.controller.DeviceHomeController();
      
      this.resetMainController();
    },

    onDestroy: function() {
      autom8.client.off('connected', this.resetMainController, this);
      autom8.client.off('disconnected', this.resetMainController, this);
      autom8.client.off('expired', this.resetMainController, this);
      this.messagingController.off('dialog:opened', this.onDialogOpened, this);
      this.messagingController.off('dialog:closed', this.onDialogClosed, this);
    },

    onDialogOpened: function() {
      if (this.mainController === this.signInController) {
        this.signInController.view.focusPasswordInput(false);
      }
    },

    onDialogClosed: function() {
      if (this.mainController === this.signInController) {
        this.signInController.view.focusPasswordInput(true);
      }
    }
  });
}());