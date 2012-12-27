namespace("autom8").Config = (function() {
  var config = {
    display: {
      animations: {
        collapse: false,
        collapseEasing: 'ease-out',
        expandEasing: 'ease-in',
        viewSwitch: false,
        viewSwitchDuration: 0.35,
        viewSwitchEasing: 'ease-in-out'
      },
      classes: {
        body: ''
      }
    }
  };

  var ua = navigator.userAgent || "";
  var isIOS = /i(Phone|Pod) OS/.test(ua) || /Apple-i(Phone|Pod)/.test(ua);
  var isChrome = /Chrome/.test(ua);

  if (isIOS) {
    config.display.animations.collapse = true;
    config.display.animations.viewSwitch = true;

    var isIOS6 = /i(Phone|Pod) OS (5|6)/.test(ua) || /Apple-i(Phone|Pod)(5|6)/.test(ua);
    if (!isIOS6) {
      config.display.animations.collapseEasing = 'linear';
      config.display.animations.expandEasing = 'linear';
      config.display.animations.viewSwitchEasing = 'linear';
    }

    config.display.classes.body = 'iphone';
  }
  else if (isChrome) {
    config.display.animations.collapse = true;
    config.display.animations.viewSwitch = true;
    config.display.classes.body = 'chrome';
  }

  $(document).ready(function() {
    $('body').addClass(config.display.classes.body);
  });

  return config;
}());