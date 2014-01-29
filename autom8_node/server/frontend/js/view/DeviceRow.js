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
    addTemplate: 'autom8-View-AddDeviceRow',
    tagName: 'li',

    events: {
    },

    onCreate: function(options) {
      this.model = options.model;
      this.index = options.index;
      this.el.dataset.index = this.index;
      this.model.on('change', this.render, this);
      this.$el.attr('tabindex', '1');

      /* sometimes DeviceRow is re-used (e.g. when embedded in the
      add dialog). in these cases, we may not want to allow the view
      owner to handle key events */
      if (!options.disableKeyboardHandler) {
        this.$el.on('keyup', this.onKeyup.bind(this));
      }

      /* similar to the above, our default templates can be overridden
      for customization purposes */
      var templateOverrides = options.templateOverrides || { };
      this.template = templateOverrides.template || this.template;
      this.editTemplate = templateOverrides.editTemplate || this.editTemplate;
      this.addTemplate = templateOverrides.addTemplate || this.addTemplate;

      switch (options.initialMode) {
        case 'edit': this.edit(); break;
        case 'add': this.add(); break;
        default: this.render();
      }
    },

    onDestroy: function() {
      this.model.off('change', this.render, this);
    },

    onKeyup: function(e) {
      if ($(e.target).hasClass('type')) {
        /* the dropdown doesn't swallow return or esc, so
        don't allow it to cancel editing. kinda heavy handed,
        but probably fine */
        return;
      }

      var editing = this.$row.hasClass('editing');
      var adding = this.$row.hasClass('adding');

      if (e.keyCode === 27) {
        if (editing) {
          this.$row.removeClass('editing adding');
          this.render();
        }
        else if (adding) {
          this.trigger('add:canceled', this);
        }
      }
      else if (e.keyCode === 13) {
        if (editing || adding) {
          this.save();
        }
      }
    },

    render: function(options) {
      if (options && options.reset) {
        this.$row.removeClass('adding editing');
      }

      var normalizedData = (this.model) && this.model.toNormalizedJSON({armed: this.attrs && this.attrs.armed});
      this.inflate(this.template, normalizedData);
      this.$row = this.$('.device-row');
    },

    edit: function () {
      var normalizedData = (this.model) && this.model.toNormalizedJSON({editing: true});
      this.inflate(this.editTemplate, normalizedData);

      this.$row = this.$('.device-row');
      this.$row.addClass('editing');

      setTimeout(function() {
        this.$('.value.name').focus();
      }.bind(this), 250);

      return true;
    },

    editing: function() {
      return this.$row.hasClass('editing');
    },

    adding: function() {
      return this.$row.hasClass('adding');
    },

    add: function () {
      this.inflate(this.addTemplate, {label: 'unnamed'});

      this.$row = this.$('.device-row');
      this.$row.addClass('adding');

      setTimeout(function() {
        this.$('.value.name').focus();
      }.bind(this), 250);
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

      if (!values) {
        rejectWithBadInput();
      }
      else {
        var oldAddress = this.model.get('address');
        var self = this;
        var options = {};
        var command;

        if (!oldAddress) {
          options = values;
          command = 'add_device';
        } else {
          options.address = oldAddress;
          options.device = values;
          command = 'edit_device';
        }

        autom8.client.rpc.send({
          component: "system",
          command: command,
          options: options
        })

        .then(function(result) {
          if (result.STATUS === autom8.client.rpc.STATUS.AUTOM8_OK) {
            var deviceList = autom8.model.SystemModel.get('deviceList');

            if (command === 'add_device') {
              var newModel = new autom8.model.Device(values);
              deviceList.add(newModel);
              self.model = newModel;
              self.trigger('add:completed', self, newModel);
            }
            else {
              deviceList.update(values, {address: oldAddress});
            }

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
