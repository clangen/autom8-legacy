 (function() {
  var View = autom8.mvc.View;

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
    },

    onDestroy: function() {
      this.model.off('change', this.render, this);
    },

    render: function() {
      var normalizedData = (this.model) && this.model.toNormalizedJSON({armed: this.attrs && this.attrs.armed});
      this.inflate(this.template, normalizedData);
    },

    edit: function () {
      var normalizedData = (this.model) && this.model.toNormalizedJSON({editing: true});
      this.inflate(this.editTemplate, normalizedData);
      this.$el.addClass('editing');
    },

    add: function () {
      this.$el.addClass('adding');
    },

    save: function () {
      var name = this.$('.name').val();
      var type = parseInt(this.$('.type').val(), 10);
      var groups = this.$('.groups').val().split(', ');
      var new_address = this.$('.address').val();

      // Need to flesh out the validation logic to show a proper error and highlight the invalid fields.
      if (groups.length === 0 || !name || !_.isNumber(type) || !new_address) {
        return 'Error';
      }

      var device = {
        address: new_address,
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
      });
    }
  });

  namespace("autom8.view").DeviceRow = DeviceRow;
}());
