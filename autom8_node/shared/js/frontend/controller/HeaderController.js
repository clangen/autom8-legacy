namespace("autom8.controller").HeaderController = (function() {
  return autom8.mvc.Controller.extend({
    onCreate: function(options) {
      options = options || { };

      this.view = new autom8.view.HeaderView({
        el: options.el || $('.header')
      });

      this.view.on('signout:clicked', this.onSignOutClicked, this);
    },

    onResume: function() {
      autom8.client.on('state:changed', this.onStateChanged, this);
      this.view.setState(autom8.client.state || 'expired');
    },

    onPause: function() {
      autom8.client.off('state:changed', this.onStateChanged, this);
      this.view.setState(autom8.client.state || 'expired');
    },

    onSignOutClicked: function() {
      autom8.client.signOut();
    },

    onStateChanged: function(state, options) {
      this.view.setState(state, options);
    }
  });
}());
