autom8.Util.Dialog = (function() {
  var dialogTemplate = $("#autom8-Dialog").html();
  var dialogButtonTemplate = $("#autom8-Dialog-Button").html();
  var nextId = 0;
  var visibleCount = 0;

  return {
    show: function(params) {
      params = params || { };
      if (!params.buttons || !params.buttons.length) {
        return;
      }

      var dialogId = "dialog-" + (nextId++);
      var $dialog = autom8.mvc.View.elementFromTemplate(dialogTemplate, params);
      var $buttonContainer = $dialog.find('.dialog-buttons');
      var negativeCallback, positiveCallback;

      $dialog.attr("id", dialogId);
      $dialog.attr("tabindex", 1);

      function showDialog() {
        $('body').append($dialog);
        addEventHandlers();
        ++visibleCount;
        $('#main-content').addClass('dialog-overlay-blur');
      }

      function keydownHandler(event) {
        event.stopPropagation();

        if (event.keyCode === 13 && positiveCallback) {
          closeDialog();
          positiveCallback();
        }
        else if (event.keyCode === 27 && negativeCallback) {
          closeDialog();
          negativeCallback();
        }
      }

      function closeDialog() {
        removeEventHandlers();
        $dialog.remove();
        --visibleCount;

        if (visibleCount === 0) {
          $('#main-content').removeClass('dialog-overlay-blur');
        }

        if (params.onClosed) {
          params.onClosed();
        }
      }

      function addEventHandlers() {
        autom8.Touchable.add('#' + dialogId, '.dialog-button', buttonHandler);
        autom8.Touchable.add('body', '#' + dialogId + '.dialog-overlay', negativeHandler);
        $('#' + dialogId).bind("keydown", keydownHandler);
      }

      function removeEventHandlers() {
        autom8.Touchable.remove('#' + dialogId, '.dialog-button');
        autom8.Touchable.remove('body', '#' + dialogId + '.dialog-overlay');
        $('#' + dialogId).unbind("keydown", keydownHandler);
      }

      function negativeHandler(event) {
        if (event.target !== event.currentTarget) {
          return;
        }

        if (negativeCallback) {
          closeDialog();
          negativeCallback();
        }
      }

      function buttonHandler(event) {
        closeDialog();

        var id = parseInt($(event.target).attr('data-id'), 10);
        var callback = params.buttons[id].callback;

        if (callback) {
          callback();
        }
      }

      _.each(params.buttons, function(button, index) {
        var $button = autom8.mvc.View.elementFromTemplate(dialogButtonTemplate, {
          caption: button.caption,
          id: index
        });

        if (button.negative) {
          negativeCallback = button.callback || function() { };
        }

        if (button.positive) {
          positiveCallback = button.callback || function() { };
        }

        $buttonContainer.append($button);
      });

      showDialog();

      $dialog.focus();

      return {
        close: function() {
          closeDialog();
        }
      };
    }
  };
}());

autom8.Util.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};