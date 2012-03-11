#ifndef AUTOM8_DIALOG_HELPER_JS_QT_H
#define AUTOM8_DIALOG_HELPER_JS_QT_H

#include <qobject.h>
#include <qwebpage.h>

class DialogHelperJs : public QObject {
	Q_OBJECT
		
public:
	DialogHelperJs(QWebPage* page, QObject * parent = 0);
	~DialogHelperJs();

	Q_INVOKABLE void showDialog(QString json);

private:
	QWebPage* mPage;
};

#endif