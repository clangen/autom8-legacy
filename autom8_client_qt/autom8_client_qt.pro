HEADERS += \
    autom8ClientJs.h \
    autom8_client_qt.h \
    autom8ClientPage.h \
    DialogHelperJs.h \
    stdafx.h

SOURCES += \
    main.cpp \
    autom8ClientJs.cpp \
    autom8ClientPage.cpp \
    autom8_client_qt.cpp \
    DialogHelperJs.cpp \
    stdafx.cpp

RESOURCES += \
    autom8_client_qt.qrc

INCLUDEPATH += \
    /opt/local/include \
    ../3rdparty/include \
    ../libautom8/src \
    ./

LIBS += \
    -L/Users/avatar -lautom8

FORMS += \
    autom8_client_qt.ui

QT += webkit
