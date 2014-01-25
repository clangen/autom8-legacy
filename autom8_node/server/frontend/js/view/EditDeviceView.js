 (function() {
  var View = autom8.mvc.View;

  var EditDeviceView = View.extend({
    template: 'autom8-View-EditDevice',
    tagName: 'div',

    events: {
    },

    onCreate: function(options) {
    },

    onDestroy: function() {
    },

    render: function() {
    }
  });

  EditDeviceView.show = function(address) {
    autom8.util.Dialog.show({
      title: "edit device",
      view: new EditDeviceView(),
      buttons: [
        {
          caption: "ok",
          positive: true,
          callback: function() {
          }
        },
        {
          caption: "cancel",
          positive: false,
          callback: function() {

          }
        }
      ]
    });
  };

  namespace("autom8.view").EditDeviceView = EditDeviceView;
}());
