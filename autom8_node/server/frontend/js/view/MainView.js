 (function() {
  var View = autom8.mvc.View;

  var MainView = View.extend({
    events: {
      'touch .button.start': function(e) {
        this.trigger('start:clicked');
      },

      'touch .button.stop': function(e) {
        this.trigger('stop:clicked');
      }
    },

    onBeforeCreate: function(options) {
      this.$el.append(View.elementFromTemplateId('autom8-View-MainView'));
    },

    onCreate: function(options) {
      this.statusView = new autom8.view.StatusView({
        el: $('.server-info')
      });

      this.devicesView = new autom8.view.DeviceListView({
        el: $('.devices')
      });

      this.buttonsView = new View({
        el: $('.bottom-buttons'),
        template: 'autom8-View-ButtonRow'
      });

      this.consoleView = new autom8.view.ConsoleView({
        el: $('.main-content-right')
      });

      this.nameToViewMap = {
        'devices': this.devicesView,
        'status': this.statusView
      };
    },

    update: function(view, model) {
      this.nameToViewMap[view].update(model);
    }
  });

  namespace("autom8.view").MainView = MainView;
}());
