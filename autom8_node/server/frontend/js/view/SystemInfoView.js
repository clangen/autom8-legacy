 (function() {
  var View = autom8.mvc.View;
  var EMPTY_PASSWORD = '••••••••';

  var redraw = function() {
    var model = this.systemModel;

    this.clearChildren();

    var view = View.fromTemplateId(
      'autom8-View-SystemInfoTable', {
        controller: model.get('system_description') || model.get('system_id'),
        fingerprint: model.get('fingerprint'),
        port: model.get('port'),
        version: model.get('version')
      }
    );

    this.addChild(view, {appendToElement: this.$el});

    setTimeout(function() {
      var connected = autom8.client.connected;
      var $el = this.$('.connection');
      var hasClass = $el.hasClass('connected');
      if (!connected && hasClass) { $el.removeClass('connected'); }
      else if (connected && !hasClass) { $el.addClass('connected'); }
    }.bind(this));

    this.$('.password-input').val(EMPTY_PASSWORD);
    this.enable(!model.get('running'));
  };

  var SystemInfoView = View.extend({
    template: 'autom8-View-SystemInfo',

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
      this.systemModel = autom8.model.SystemModel;
      this.systemModel.on('change', redraw, this);
      this.render();
    },

    onDestroy: function() {
      this.systemModel.off('change', redraw, this);
    },

    render: function() {
      redraw.call(this);
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

  namespace("autom8.view").SystemInfoView = SystemInfoView;
}());
