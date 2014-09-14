alert('sup');

exports.install = function() {
    var remote = require('remote');
    var Menu = remote.require('menu');
    var appMenu = Menu.getApplicationMenu();

    var menuTemplate = [
        {
            label: 'autom8',
            submenu: [
                {
                    label: 'preferences',
                    click: function() { }
                },
                {
                    label: 'quit',
                    click: function() {
                        window.close();
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
};