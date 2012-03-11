#ifndef AUTOM8_CLIENT_QT_H
#define AUTOM8_CLIENT_QT_H

#include <QtGui/QMainWindow>
#include "ui_autom8_client_qt.h"

class autom8_client_qt : public QMainWindow {
	Q_OBJECT

public:
	autom8_client_qt(QWidget *parent = 0, Qt::WFlags flags = 0);
	~autom8_client_qt();

private:
	Ui::autom8_client_qtClass ui;
};

#endif // AUTOM8_CLIENT_QT_H
