#include "stdafx.h"
#include "autom8_client_qt.h"
#include <QtGui/QApplication>

int main(int argc, char *argv[])
{
	QApplication a(argc, argv);
	autom8_client_qt w;
	w.show();
	return a.exec();
}
