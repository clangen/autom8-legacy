#include "stdafx.h"
#include "DialogHelperJs.h"

#include <qwebframe.h>

#include <debug.hpp>
#include <json.hpp>

static std::string TITLE = "title";
static std::string MESSAGE = "message";
static std::string ICON = "icon";
static std::string BUTTONS = "buttons";
static std::string CAPTION = "caption";
static std::string ACTION = "callback";

static std::string TAG = "DialogHelperJs";

typedef std::map<std::string, QMessageBox::Icon> IconMap;
static IconMap sIconMap;

using autom8::debug;

static void initIconMap() {
	if (sIconMap.empty()) {
		sIconMap["information"] = QMessageBox::Information;
		sIconMap["question"] = QMessageBox::Question;
		sIconMap["warning"] = QMessageBox::Warning;
		sIconMap["critical"] = QMessageBox::Critical;
	}
}

DialogHelperJs::DialogHelperJs(QWebPage* page, QObject* parent)
: QObject(parent)
, mPage(page)
{
	initIconMap();
}

DialogHelperJs::~DialogHelperJs() {

}

struct JsButton {
	JsButton(const QString& caption, const QString& callback) {
		this->caption = caption;
		this->callback = callback;
	}

	QString caption;
	QString callback;
};

void DialogHelperJs::showDialog(QString jsonString) {
	autom8::json_value json;

	autom8::json_reader reader;
	if (( ! reader.parse(jsonString.toStdString().c_str(), json))
    || (json.type() != autom8::json::objectValue))
	{
		debug::log(debug::error, TAG, "bad JSON sent to showDialog()");
        return;
    }

	std::string message, title;
	std::vector<JsButton> buttons;
	QMessageBox::Icon icon = QMessageBox::Information;

	try {
		message = json[MESSAGE].asString();
		title = json[TITLE].asString();
		std::string iconStr = json[ICON].asString();

		if (sIconMap.find(iconStr) != sIconMap.end()) {
			icon = sIconMap[iconStr];
		}

		const autom8::json_value buttonsArray = json[BUTTONS];
		if (buttonsArray.isArray()) {
			for (int i = 0; i < (int) buttonsArray.size(); i++) {
				autom8::json_value current = buttonsArray[i];
				buttons.push_back(JsButton(
					QString::fromStdString(current[CAPTION].asString()),
					QString::fromStdString(current[ACTION].asString())));
			}
		}
	
		if (buttons.empty()) {
			buttons.push_back(JsButton("OK", QString("")));
		}
	}
	catch (...) {
		debug::log(debug::error, TAG, "invalid or missing dialog parameters detected");
		return;
	}

	QMessageBox* box = new QMessageBox(mPage->view());
	box->setWindowTitle(QString::fromStdString(title));
	box->setText(QString::fromStdString(message));
	box->setIcon(icon);

	for (size_t i = 0; i < buttons.size(); i++) {
		box->addButton(buttons[i].caption, QMessageBox::AcceptRole);
	}

	box->setModal(true);
	box->exec();

	QAbstractButton* result = box->clickedButton();
	if (result != NULL) {
		for (size_t i = 0; i < buttons.size(); i++) { 
			if (result->text() == buttons[i].caption) {
				if (buttons[i].callback.size() > 0) {
					QWebFrame* f = mPage->currentFrame();
					f->evaluateJavaScript(buttons[i].callback);
				}

				break;
			}
		}
	}

	delete box;
}

