#ifndef AUTOM8_CLIENT_PAGE_QT_H
#define AUTOM8_CLIENT_PAGE_QT_H

#include "DialogHelperJs.h"

#include <qwebpage.h>

class autom8ClientPage: public QWebPage {
	Q_OBJECT

public:
	/*ctor*/ autom8ClientPage(QUrl url, QObject * parent = 0);
	void load();

protected slots:
	void onFrameLoaded(bool ok);

protected:
	void javaScriptConsoleMessage (
		const QString & message,
		int lineNumber,
		const QString & sourceID);

private:
	QUrl mUrl;
	DialogHelperJs mDialogHelper;
};

#endif
