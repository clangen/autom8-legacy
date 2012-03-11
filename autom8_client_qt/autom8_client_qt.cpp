#include "stdafx.h"
#include "autom8_client_qt.h"
#include "autom8ClientJs.h"
#include "stdafx.h"
#include "autom8ClientPage.h"

#include <qwebframe.h>
#include <qtextstream.h>

static QString ROOT = "qrc:/autom8_client_qt/res/";
static QString MAIN = ROOT + "index.html";

autom8_client_qt::autom8_client_qt(QWidget *parent, Qt::WFlags flags)
: QMainWindow(parent, flags)
{
	ui.setupUi(this);

	setWindowTitle("autom8");

	autom8ClientPage* page = new autom8ClientPage(QUrl(MAIN), ui.webView);

	if (AUTOM8_DEBUG) {
		/* debug mode directly accesses resource files to avoid constant recompiles */
		ui.webView->settings()->setAttribute(QWebSettings::LocalContentCanAccessFileUrls, true);
		ui.webView->settings()->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
	}
	
	if ( ! AUTOM8_WEBVIEW_CONTEXT_MENU) {
		/* hide context menu in release mode! */
		ui.webView->setContextMenuPolicy(Qt::NoContextMenu);
	}

	ui.webView->setPage(page);
	page->load();
}

autom8_client_qt::~autom8_client_qt() {

}
