HEADERS += \
    DevicesListModel.h \
    EditDeviceDialog.h \
    LogListModel.h \
    MainWindow.h \
    stdafx.h

SOURCES += \
    DevicesListModel.cpp \
    EditDeviceDialog.cpp \
    LogListModel.cpp \
    MainWindow.cpp \
    main.cpp \
    stdafx.cpp

RESOURCES += \
    autom8_server_qt.qrc

INCLUDEPATH += \
    /opt/local/include \
    ../3rdparty/include \
    ../libautom8/src \
    ./

LIBS += \
    -L/Users/avatar -lautom8

FORMS += \
    autom8_server_qt.ui \
    autom8_server_edit_device.ui

