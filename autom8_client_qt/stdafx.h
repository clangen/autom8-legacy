#if defined(WIN32)

#define _WIN32_WINNT 0x0502
#define WINVER 0x0502
#define WIN32_LEAN_AND_MEAN

#include <WinSock2.h>
#include <windows.h>

#include <devices/x10/cm15a/cm15a_device_system.hpp>

#endif

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

#define u2q(x) QString::fromUtf8(x.c_str())

#if defined DEBUG
	#define AUTOM8_DEBUG true
	#define AUTOM8_WEBVIEW_CONTEXT_MENU true
	#define AUTOM8_DEBUG_PATH "D:\\src\\autom8\\autom8_client_qt\\res\\index.html"
#else
	#define AUTOM8_DEBUG false
	#define AUTOM8_WEBVIEW_CONTEXT_MENU false
	#define AUTOM8_DEBUG_PATH ""
#endif
