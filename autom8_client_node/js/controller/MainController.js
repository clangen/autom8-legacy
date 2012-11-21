namespace("autom8.controller").MainController = (function() {
  return autom8.mvc.Controller.extend({
    mixins: [
      autom8.mvc.mixins.ControllerContainer
    ],

    onCreate: function(options) {
      this.view = new autom8.mvc.View({el: $('#main-content')});

      this.headerController = this.addChild(new autom8.controller.HeaderController());
      this.view.addChild(this.headerController.view);
      
      this.controller = this.addChild(new options.ControllerType());
      this.view.addChild(this.controller.view);
    }
  });
}());