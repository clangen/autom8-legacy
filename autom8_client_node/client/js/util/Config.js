namespace("autom8").Config = (function() {
  var config = {
    display: {
      animations: {
        collapse: false,
        collapseEasing: 'ease-out',
        expandEasing: 'ease-in',
        viewSwitch: false,
        viewSwitchDuration: 0.35,
        viewSwitchEasing: 'ease-in-out',
        viewSwitcher: false,
        viewSwitcherDuration: 0.30,
        viewSwitcherEasing: 'ease-out',
        dialog: false,
        dialogDuration: 0.25,
        dialogEasing: 'ease-in-out'
      },
      classes: {
        body: ''
      }
    }
  };

  var ua = navigator.userAgent || "";
  var isIOS = /i(Phone|Pod) OS/.test(ua) || /Apple-i(Phone|Pod)/.test(ua);
  var isChrome = /Chrome/.test(ua);
  var isIOSChrome = isIOS && /CriOS/.test(ua);
  var isWebkit = /AppleWebKit/.test(ua);
  var isFirefox = /Firefox/.test(ua);
  var isAndroidWebkit = /.*Android.*AppleWebKit.*/.test(ua);
  var isAndroidChrome = /.*Android.*Chrome.*/.test(ua);

  if (isAndroidWebkit || isAndroidChrome) {
    config.display.classes.body = (isIOSChrome ? 'android-chrome' : 'android');
  }
  else if (isChrome || isIOSChrome || isWebkit) {
    config.display.animations.collapse = true;
    config.display.animations.viewSwitch = true;
    config.display.animations.viewSwitcher = true;
    config.display.animations.dialog = true;

    config.display.classes.body = (isIOSChrome ? 'iphone-chrome' : 'chrome') + ' fixed-header';
  }
  else if (isIOS) {
    config.display.animations.collapse = true;
    config.display.animations.viewSwitch = true;
    config.display.animations.viewSwitcher = true;
    config.display.animations.dialog = true;

    var isIOS6 = /i(Phone|Pod) OS (5|6)/.test(ua) || /Apple-i(Phone|Pod)(5|6)/.test(ua);

    if (!isIOS6) {
      config.display.animations.collapseEasing = 'linear';
      config.display.animations.expandEasing = 'linear';
      config.display.animations.viewSwitchEasing = 'linear';
      config.display.animations.viewSwitcherEasing = 'linear';
      config.display.animations.dialogEasing = 'linear';
    }

    config.display.classes.body = 'iphone fixed-header';
  }
  if (isFirefox) {
    config.display.animations.collapse = true;
    config.display.animations.viewSwitch = true;
    config.display.animations.viewSwitcher = true;
    config.display.animations.dialog = true;
    config.display.classes.body = 'firefox fixed-header';
  }

  $(document).ready(function() {
    $('body').addClass(config.display.classes.body);
  });

  return config;
}());
