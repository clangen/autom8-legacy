(function() {
  var ViewInflater = {
    'class': {
      htmlFromTemplate: function(template, params) {
        var compiled = Handlebars.compile(template);
        return compiled(params || {});
      },

      htmlFromTemplateId: function(templateId, params) {
        if (templateId[0] !== '#') {
          templateId = '#' + templateId;
        }

        var template = $(templateId).html();
        return $(this.htmlFromTemplate(template, params));
      },

      elementFromTemplate: function(template, params) {
        return $(this.htmlFromTemplate(template, params));
      },

      elementFromTemplateId: function(templateId, params) {
        return $(this.htmlFromTemplateId(templateId, params));
      },

      fromTemplateId: function(templateId, params) {
        return new autom8.mvc.View({
          el: this.elementFromTemplateId(templateId, params)
        });
      }
    },

    'prototype': {
      inflate: function(templateId, params) {
        var $inflated = ViewInflater['class'].elementFromTemplateId(templateId, params);

        var merge =
          ($inflated.length === 1) && (this.$el.length === 1) &&
          ($inflated.get(0).className === this.$el.get(0).className);

        this.$el.empty().append(merge ? $inflated.children() : $inflated);

        return this;
      }
    },

    'lifecycle': {
      onBeforeCreate: function(options) {
        options = options || { };
        var template = options.template || this.template;
        var params = options.templateParams  || this.templateParams;

        if (template) {
          this.inflate(template, params);
        }
      }
    }
  };

  namespace("autom8.mvc.mixins").ViewInflater = ViewInflater;
}());