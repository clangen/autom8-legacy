namespace("autom8.view").SwitcherView = (function() {
  var stateToHtmlMap = {
    flat: "switch to grouped view <b>&gt;</b>",
    grouped: "switch to flat view <b>&gt;</b>"
  };

  var View = autom8.mvc.View;

  return View.extend({
    className: "switch-devices-view",

    onCreate: function(options) {
      options = options || { };
    },
    
    getState: function() {
      return this.state || localStorage['autom8.lastDevicesView'] || 'grouped';
    },

    setState: function(state) {
      if (this.state === state) {
        return;
      }

      try {
        localStorage['autom8.lastDevicesView'] = state;
      }
      catch (e) {
        console.log('local storage write failed');
      }

      this.state = state;
      this.$el.html(stateToHtmlMap[state]);
    }
  });
}());
