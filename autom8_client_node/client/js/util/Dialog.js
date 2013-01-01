namespace("autom8.util").Dialog = (function() {
  var dialogTemplate = $("#autom8-Dialog").html();
  var dialogButtonTemplate = $("#autom8-Dialog-Button").html();
  var nextId = 0;
  var visibleCount = 0;

  return {
    show: function(params) {
      params = params || { };
      var anims = autom8.Config.display.animations;

      if (!params.buttons || !params.buttons.length) {
        return;
      }

      var dialogId = "dialog-" + (nextId++);
      var $dialog = autom8.mvc.View.elementFromTemplate(dialogTemplate, params);
      var $customViewContainer = $dialog.find('.dialog-custom-view').eq(0);
      var $buttonContainer = $dialog.find('.dialog-buttons');
      var negativeCallback, positiveCallback, cancelCallback;

      $dialog.attr("id", dialogId);
      $dialog.attr("tabindex", nextId + 1);

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

      function showDialog() {
        $('#dialogs').append($dialog);
        addEventHandlers();
        ++visibleCount;
        $('#top-level-container').addClass('dialog-overlay-blur');
        $('#dialogs').addClass('dialog-overlay dialog-background');

        if (params.view) {
          params.view.resume();
        }

        if (anims.dialog) {
          autom8.Animation.css($dialog, dialogId + '-animation', {
            duration: anims.dialogDuration,
            easing: anims.dialogEasing,
            property: 'left',
            onPrepared: function() {
              $dialog.removeClass('left');
            }
          });
        }
        else {
          $dialog.removeClass('left');
        }
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

      function onCloseCompleted() {
        if (params.view) {
          params.view.parent = null;
          params.view.destroy();
        }

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

      function closeDialog(callback) {
        if (anims.dialog) {
          autom8.Animation.css($dialog, dialogId + '-animation', {
            duration: anims.dialogDuration,
            easing: anims.dialogEasing,
            property: 'left',
            onPrepared: function() {
              $dialog.removeClass('left').addClass('right');
            },
            onAfterCompleted: _.bind(function(canceled) {
              onCloseCompleted();
              if (callback) {
                callback();
              }
            }, this)
          });
        }
        else {
          $dialog.removeClass('left').addClass('right');
          onCloseCompleted();
          if (callback) {
            callback();
          }
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
            callback();
          }
        });
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