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

      /* sometimes DeviceRow is re-used (e.g. when embedded in the
      add dialog). in these cases, we may not want to allow the view
      owner to handle key events */
      if (!options.disableKeyboardHandler) {
        this.$el.on('keyup', this.onKeyup.bind(this));
      }

      if (options.initialMode === 'edit') {
        this.edit();
      }
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
      else if (e.keyCode === 13) {
        if (this.$el.hasClass('editing')) {
          this.save();
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

    validate: function() {
      var values = {
        label: this.$('.name').val(),
        type: parseInt(this.$('.type').val(), 10),
        groups: this.$('.groups').val().split(', ') || 'none',
        address: this.$('.address').val()
      };

      if (values.groups.length === 0 || !values.label || !_.isNumber(values.type) || !values.address) {
        return false;
      }

      return values;
    },

    save: function () {
      var deferred = Q.defer();

      var values = this.validate();

      var rejectWithBadInput = function() {
        showBadInputDialog();
        deferred.reject();
      };

      // Need to flesh out the validation logic to show a proper error and highlight the invalid fields.
      if (!values) {
        showBadInputDialog();
        deferred.reject();
      }
      else {
        var oldAddress = this.model.get('address');

        var self = this;

        autom8.client.rpc.send({
          component: "system",
          command: 'edit_device',
          options: {
            address: oldAddress,
            device: values
          }
        })

        .then(function(result) {
          if (result.STATUS === autom8.client.rpc.STATUS.AUTOM8_OK) {
            var deviceList = autom8.model.SystemModel.get('deviceList');
            deviceList.update(values, {address: oldAddress});
            self.$el.removeClass('editing adding');
            self.render();
            deferred.resolve();
          }
          else {
            rejectWithBadInput();
          }
        })

        .fail(function() {
          rejectWithBadInput();
        });
      }

      return deferred.promise;
    }
  });

  namespace("autom8.view").DeviceRow = DeviceRow;
}());
