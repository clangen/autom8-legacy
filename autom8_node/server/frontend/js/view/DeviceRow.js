 (function() {
  var View = autom8.mvc.View;

  var showBadInputDialog = function() {
    autom8.util.Dialog.show({
      title: "bad device settings",
      message: "the specified device information will not work. please make sure the " +
        "device has a name, type, and an address. also make sure the address isn't " +
        "already used by another device.",
      buttons: [{
          caption: "ok",
          positive: true,
          negative: true
      }]
    });
  };

  var DeviceRow = View.extend({
    template: 'autom8-View-DeviceRow',
    editTemplate: 'autom8-View-EditDeviceRow',
    tagName: 'li',
    className: 'device-row',

    events: {
    },

    onCreate: function(options) {
      this.model = options.model;
      this.index = options.index;
      this.render();
      this.el.dataset.index = this.index;
      this.model.on('change', this.render, this);
      this.$el.attr('tabindex', '1');
      this.$el.on('keyup', this.onKeyup.bind(this));
    },

    onDestroy: function() {
      this.model.off('change', this.render, this);
    },

    onKeyup: function(e) {
      if (e.keyCode === 27) {
        if (this.$el.hasClass('editing')) {
          this.$el.removeClass('editing adding');
          this.render();
        }
      }
    },

    render: function() {
      var normalizedData = (this.model) && this.model.toNormalizedJSON({armed: this.attrs && this.attrs.armed});
      this.inflate(this.template, normalizedData);
    },

    edit: function () {
      var normalizedData = (this.model) && this.model.toNormalizedJSON({editing: true});
      this.inflate(this.editTemplate, normalizedData);
      this.$el.addClass('editing');
      return true;
    },

    add: function () {
      this.$el.addClass('adding');
    },

    save: function () {
      var deferred = Q.defer();

      var name = this.$('.name').val();
      var type = parseInt(this.$('.type').val(), 10);
      var groups = this.$('.groups').val().split(', ');
      var newAddress = this.$('.address').val();

      // Need to flesh out the validation logic to show a proper error and highlight the invalid fields.
      if (groups.length === 0 || !name || !_.isNumber(type) || !newAddress) {
        showBadInputDialog();
        deferred.reject();
      }
      else {
        var device = {
          address: newAddress,
          label: name,
          groups: groups,
          type: type
        };

        autom8.client.rpc.send({
          component: "system",
          command: 'edit_device',
          options: {
            address: this.model.get('address'),
            device: device
          }
        })

        .then(function() {
          autom8.model.SystemModel.fetch();
          deferred.resolve();
        })

        .fail(function() {
          showBadInputDialog();
          deferred.reject();
        });
      }

      return deferred.promise;
    }
  });

  namespace("autom8.view").DeviceRow = DeviceRow;
}());
