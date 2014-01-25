namespace("autom8.util").Dialog = (function() {
  var dialogTemplate = $("#autom8-Dialog").html();
  var dialogButtonTemplate = $("#autom8-Dialog-Button").html();
  var nextId = 0;

  return {
    show: function(params) {
      params = params || { };
      var anims = autom8.Config.display.animations;

      if ((!params.buttons || !params.buttons.length) && !cancelable) {
        return;
      }

      var dialogId = "dialog-" + (nextId++);
      var $dialog = autom8.mvc.View.elementFromTemplate(dialogTemplate, params);
      var $customViewContainer = $dialog.find('.dialog-custom-view').eq(0);
      var $buttonContainer = $dialog.find('.dialog-buttons');
      var negativeCallback, positiveCallback, cancelCallback;

      function prepareDialog() {
        /* give this dialog a unique id and tab index so it can capture
        key events */
        $dialog.attr("id", dialogId);
        $dialog.attr("tabindex", nextId + 1);

        /* if a custom view is specified, validate it's in the proper
        state before trying to use it */
        if (params.view && params.view.$el) {
          if (params.view.parent) {
            throw {error: 'dialog view already has a parent'};
          }

          params.view.parent = this;
          $customViewContainer.append(params.view.$el);
        }
        else {
          $customViewContainer.hide();
        }

        /* wire up the cancel, positive, and negative callbacks while
        adding the button widgets to the dialog */
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
      }

      function showDialog() {
        /* provisions the dialog itself, but doesn't actually show it */
        prepareDialog();

        /* get the dialog prepared before we animate it into place */
        $('#dialogs').append($dialog);
        addEventHandlers();
        $('#application').children().addClass('dialog-overlay-blur');
        $('#dialogs').addClass('dialog-overlay dialog-background');

        if (params.view) {
          params.view.resume();
        }

        /* animate it! */
        if (anims.dialog) {
          autom8.Animation.css($dialog, dialogId + '-animation', {
            duration: anims.dialogDuration,
            easing: anims.dialogEasing,
            onAfterStarted: function() {
              $dialog.removeClass('left');
            },
            onAfterCompleted: function() {
              $dialog.focus();
            }
          });
        }
        else {
          $dialog.removeClass('left');
          $dialog.focus();
        }
      }

      function closeDialog(callback) {
        /* we animate closing the dialog first, then this method will
        be invoked to do the actual cleanup */
        var onCloseCompleted = function() {
          $dialog.remove();

          if ($("#dialogs").children().length === 0) {
            $('#application').children().removeClass('dialog-overlay-blur');
            $('#dialogs').removeClass('dialog-overlay dialog-background');
          }

          removeEventHandlers();

          var form = params.view.$('form');
          var results = null;
          if (form) {
            results = form.serializeArray();
          }

          if (params.view) {
            params.view.parent = null;
            params.view.destroy();
          }

          if (params.onClosed) {
            params.onClosed();
          }

          if (callback) {
            callback(results);
          }
        };

        /* animate it! */
        if (anims.dialog) {
          autom8.Animation.css($dialog, dialogId + '-animation', {
            duration: anims.dialogDuration,
            easing: anims.dialogEasing,
            onAfterStarted: function() {
              $dialog.addClass('left');
            },
            onCompleted: onCloseCompleted
          });
        }
        else {
          $dialog.addClass('left');
          onCloseCompleted();
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

      function keydownHandler(event) {
        event.stopPropagation();

        /* return/enter */
        if (event.keyCode === 13 && positiveCallback) {
          closeDialog(function() {
            positiveCallback();
          });
        }
        /* esc */
        else if ((event.keyCode === 27) && (params.cancelable !== false)) {
          closeDialog(function() {
            if (params.onCanceled) {
              params.onCanceled();
            }
          });
        }
      }

      function cancelHandler(event) {
        if (params.cancelable === false) {
          return;
        }

        if (event.target !== event.currentTarget) {
          return;
        }

        closeDialog(function() {
          if (params.onCanceled) {
            params.onCanceled();
          }
        });
      }

      function buttonHandler(event) {
        closeDialog(function() {
          var id = parseInt($(event.target).attr('data-id'), 10);
          var callback = params.buttons[id].callback;

          if (callback) {
            callback.apply(this, arguments);
          }
        });
      }

      showDialog();

      return {
        close: function(callback) {
          closeDialog(callback);
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