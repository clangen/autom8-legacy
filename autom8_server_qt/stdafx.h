#if defined(WIN32)
    #define _WIN32_WINNT 0x0502
    #define WINVER 0x0502
    #define WIN32_LEAN_AND_MEAN

    #include <WinSock2.h>
    #include <windows.h>

    #include <devices/x10/cm15a/cm15a_device_system.hpp>
#endif // WIN32

#include <QtGui>
#include <QAbstractItemModel>
#include <QMessageBox>
#include <QMainWindow>
#include <QDate>
#include <QApplication>

#include <sqlite/sqlite3.h>

#include <boost/format.hpp>

#include <devices/device_system.hpp>
#include <server.hpp>
#include <debug.hpp>
#include <ssl_certificate.hpp>
#include <preferences.hpp>

#include <sigslot/sigslot.h>

#include <map>
#include <vector>
#include <string>
