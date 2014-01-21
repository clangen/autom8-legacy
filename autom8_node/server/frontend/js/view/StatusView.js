 (function() {
  var View = autom8.mvc.View;
  var EMPTY_PASSWORD = '••••••••';

  var StatusView = View.extend({
    template: 'autom8-View-ServerInfo',

    events: {
      'input .password-input': function(event) {
        this.passwordChanged = true;

        if (event.keyCode === 13) {
          $(event.target).blur();
        }
      },

      'focus .password-input': function(event) {
        var $input = $(event.target);
        if ($input.val() === EMPTY_PASSWORD) {
          $input.val('');
        }
      },

      'blur .password-input': function(event) {
        var $input = $(event.target);
        if ($input.val() === '') {
          $input.val(EMPTY_PASSWORD);
          this.passwordChanged = false;
        }
      },

      'change .port-input': function(event) {
        this.portChanged = true;
      }
    },

    onCreate: function(options) {
      this.update(null);
    },

    update: function(model) {
      model = model || { };

      this.inflate(
        'autom8-View-ServerInfo', {
          controller: model.system_description || model.system_id,
          fingerprint: model.fingerprint,
          port: model.port,
          version: model.version
      });

      this.$('.password-input').val(EMPTY_PASSWORD);
      this.enable(!model.running);
    },

    enable: function(enabled) {
      enabled = enabled || (enabled === undefined);

      this.$('.content').toggleClass('disabled', !enabled);
      $inputs = this.$('input');

      if (enabled) {
        $inputs.removeAttr("disabled");
      }
      else {
        $inputs.attr("disabled", "disabled");
      }
    },

    dirty: function() {
      return this.passwordChanged || this.portChanged;
    },

    resetDirtyState: function() {
      this.$('.password-input').val(EMPTY_PASSWORD);
      this.passwordChanged = this.portChanged = false;
    }
  });

  namespace("autom8.view").StatusView = StatusView;
}());
