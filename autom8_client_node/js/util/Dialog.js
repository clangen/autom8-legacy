namespace("autom8.util").Dialog = (function() {
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
      var negativeCallback, positiveCallback, cancelCallback;

      $dialog.attr("id", dialogId);
      $dialog.attr("tabindex", nextId + 1);

      function showDialog() {
        $('#dialogs').append($dialog);
        addEventHandlers();
        ++visibleCount;
        $('#top-level-container').addClass('dialog-overlay-blur');
        $('#dialogs').addClass('dialog-overlay dialog-background');
      }

      function keydownHandler(event) {
        event.stopPropagation();

        if (event.keyCode === 13 && positiveCallback) {
          closeDialog();
          positiveCallback();
        }
        else if ((event.keyCode === 27) && (params.cancelable !== false)) {
          closeDialog();

          if (params.onCanceled) {
            params.onCanceled();
          }
        }
      }

      function closeDialog() {
        removeEventHandlers();
        $dialog.remove();
        --visibleCount;

        if (visibleCount === 0) {
          $('#top-level-container').removeClass('dialog-overlay-blur');
          $('#dialogs').removeClass('dialog-overlay dialog-background');
        }

        if (params.onClosed) {
          params.onClosed();
        }
      }

      function addEventHandlers() {
        autom8.mvc.View.addTouchable('#' + dialogId, '.dialog-button', buttonHandler);
        autom8.mvc.View.addTouchable('#dialogs', '#' + dialogId + '.dialog-overlay', cancelHandler);
        $('#' + dialogId).bind("keydown", keydownHandler);
      }

      function removeEventHandlers() {
        autom8.mvc.View.removeTouchable('#' + dialogId, '.dialog-button', buttonHandler);
        autom8.mvc.View.removeTouchable('#dialogs', '#' + dialogId + '.dialog-overlay', cancelHandler);
        $('#' + dialogId).unbind("keydown", keydownHandler);
      }

      function cancelHandler(event) {
        if (params.cancelable === false) {
          return;
        }

        if (event.target !== event.currentTarget) {
          return;
        }

        if (params.onCanceled) {
          params.onCanceled();
        }

        closeDialog();
      }

      function buttonHandler(event) {
        closeDialog();

        var id = parseInt($(event.target).attr('data-id'), 10);
        var callback = params.buttons[id].callback;

        if (callback) {
          callback();
        }
      }

      cancelCallback = params.cancelCallback;

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

namespace("autom8.util").Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};