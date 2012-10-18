autom8.View.Util = {
  htmlFromTemplate: function(template, params) {
    var compiled = Handlebars.compile(template);
    return compiled(params || {});
  },

  elementFromTemplate: function(template, params) {
    return $(this.htmlFromTemplate(template, params));
  }
};
