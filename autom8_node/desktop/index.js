var app = require('app');
var path = require('path');
var BrowserWindow = require('browser-window');

global.DEBUG = true;
var target = global.DEBUG ? "/dist/debug" : "/dist/release";

// Report crashes to our server.
// require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    app.quit();
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'autom8',
    icon: path.resolve(__dirname + target + '/icon.png')
  });

  if (DEBUG) {
    mainWindow.openDevTools();
  }

  var index = 'file://' + __dirname + target + '/index.html';
  mainWindow.loadUrl(index);

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});