#include "stdafx.h"
#include "MainWindow.h"

#include <QtGui/QApplication>
#include <devices/device_system.hpp>
#include <string>

/*
 * Magic so we can pass our non-QT types through QMetaObject::invokeMethod
 * to bounce calls back to the UI thread.
 *
 * We must call the macros first before calling initMetaTypes(), as the
 * macros instantiate templates required for qRegisterMetaType.
 */
Q_DECLARE_METATYPE(autom8::device_ptr);
Q_DECLARE_METATYPE(std::string);

void initMetaTypes() {
	qRegisterMetaType<autom8::device_ptr>();
	qRegisterMetaType<std::string>();
}

int main(int argc, char *argv[]) {
	autom8::debug::init();
	QApplication a(argc, argv);
	initMetaTypes();
	MainWindow w;
	w.show();
	return a.exec();
	autom8::debug::deinit();
}
