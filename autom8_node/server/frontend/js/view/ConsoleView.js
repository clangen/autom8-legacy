 (function() {
  var View = autom8.mvc.View;
  var MAX_ENTRIES = 100;
  var oddEven = 0;

  var onRpcLog = function(html) {
    var scrollToBottom = false;
    /* if we're already scrolled to the bottom, scroll to the
    new item. note: the -4 here is a bit of a fudge factor.
    why is this necessary? */
    var overflow = this.$console.height() - this.$container.height();

    if (overflow > 0) {
      var pos = this.$container.scrollTop();
      scrollToBottom = (pos >= (overflow - 4));
    }
    /* no scrollbar yet, but there may be... */
    else if (this.$console.height() < this.$container.height()) {
      scrollToBottom = true;
    }

    /* if we've reached out max entries, drop the first one */
    var count = this.$console.children().length;
    if (count > MAX_ENTRIES) {
      this.$console.children()[0].remove();
    }

    if (_.isString(html)) {
      html = [html];
    }

    for (var i = 0; i < html.length; i++) {
      var cls = (oddEven++ % 2 === 0) ? "even" : "odd";
      this.$console.append($(html[i]).addClass(cls));
    }

    /* the height() calculation on $console may not be accurate
    until the next time through the runloop... */
    if (scrollToBottom || this.scrolledToBottom) {
      var self = this;
      setTimeout(function() {
        self.$container.scrollTop(self.$console.height());
        this.scrolledToBottom = true;
      });
    }

    /* note that when the console becomes invisible -- e.g. due to a
    media query -- scrolling no longer works. so, we remember whether
    or not we're scrolled to the bottom last time around. */
    this.scrolledToBottom = false;
  };

  var ConsoleView = View.extend({
    template: 'autom8-View-Console',

    events: {
    },

    onCreate: function(options) {
      this.$console = this.$('.console');
      this.$container = this.$('.console-container');
      autom8.client.on('log', onRpcLog, this);
    },

    onDestroy: function() {
      autom8.client.off('log', onRpcLog, this);
    }
  });

  namespace("autom8.view").ConsoleView = ConsoleView;
}());
