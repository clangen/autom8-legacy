#include "stdafx.h"

#include "autom8ClientPage.h"
#include "autom8ClientJs.h"

#include <utility.hpp>

#include <qwebframe.h>

// TODO: fix leak by moving someplace where destruction order
// is deterministic. right now this may crash on shutdown
// because it tries to log in its destructor after the logging
// support objects have been cleaned up by the runtime.
static autom8ClientJs* sClientInstance = new autom8ClientJs();

static QString ENV = "autom8.Environment";
static QString ENV_INIT = ".init";

#define RAISE_JS_CALLBACK(out, method) \
	QTextStream(&out)  \
	<< "if (autom8 && (" << ENV << ") && (" << ENV << method << ")) {" \
	<< "  " << ENV << method << "();" \
	<< "}"; \

autom8ClientPage::autom8ClientPage (QUrl url, QObject* parent)
: QWebPage(parent)
, mUrl(url)
, mDialogHelper(this)
{
}

void autom8ClientPage::load() {
	QWebFrame* f = currentFrame();
	if (f) {
		if (AUTOM8_DEBUG) {
			f->setUrl(QUrl::fromLocalFile(AUTOM8_DEBUG_PATH));
		}
		else {
			f->setUrl(mUrl);
		}

		connect(f, SIGNAL(loadFinished(bool)), this, SLOT(onFrameLoaded(bool)));
	}
}

void autom8ClientPage::javaScriptConsoleMessage (const QString & message, int lineNumber, const QString & sourceID) {
	QWebPage::javaScriptConsoleMessage(message, lineNumber, sourceID);

	QString formattedMessage;
	QTextStream(&formattedMessage) 
		<< message 
		<< "\r\n\r\nFile: " << sourceID
		<< "\r\n\r\nLine: " << lineNumber;

	QMessageBox* box = new QMessageBox();
	box->setAttribute(Qt::WA_DeleteOnClose);
	box->setWindowTitle("autom8 client JavaScript error");
	box->setText(formattedMessage);
	box->show();
}

void autom8ClientPage::onFrameLoaded(bool ok) {
	QString path = u2q(autom8::utility::settings_directory());
	settings()->setOfflineStoragePath(path);
	settings()->setLocalStoragePath(path);
	settings()->setOfflineStorageDefaultQuota(1024 * 1024);
	settings()->setAttribute(QWebSettings::LocalStorageEnabled, true);
	settings()->setAttribute(QWebSettings::OfflineStorageDatabaseEnabled, true);

	QWebFrame* f = currentFrame();

	/* add the autom8 client */
	f->addToJavaScriptWindowObject(
		QString("autom8Client"),
        sClientInstance,
		QScriptEngine::QtOwnership);

	/* add the DialogHelper */
	f->addToJavaScriptWindowObject(
		QString("DialogHelper"),
        &this->mDialogHelper,
		QScriptEngine::QtOwnership);

	/* initialize the environment */
	QString init;
	RAISE_JS_CALLBACK(init, ENV_INIT);

	f->evaluateJavaScript(init);
}
