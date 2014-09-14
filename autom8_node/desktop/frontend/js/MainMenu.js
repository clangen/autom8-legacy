module.exports.install = function() {
    var remote = require('remote');
    var Menu = remote.require('menu');
    var appMenu = Menu.getApplicationMenu();

    var menuTemplate = [
        {
            label: 'autom8',
            submenu: [
                {
                    label: 'preferences',
                    accelerator: 'Command+P',
                    click: function() { }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'quit',
                    accelerator: 'Command+Q',
                    click: function() {
                        window.close();
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
};