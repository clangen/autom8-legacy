if ( ! autom8) {
  alert("Error: autom8 namespace doesn't exist yet!");
}

autom8.Ui.Dialog = (function() {
  /*
   * public api
   */
  return {
    show: function(dialogParams) {
      DialogHelper.showDialog(JSON.stringify(dialogParams));
    }
  }
})(); // autom8.Ui.Main

autom8.Ui.Dialog.Icon = {
  Question: "question",
  Information: "information",
  Warning: "warning",
  Critical: "critical"
};