#include "stdafx.h"
#include "MainWindow.h"
#include "EditDeviceDialog.h"

#if defined(WIN32)
    #include <autom8/device/x10/cm15a/cm15a_device_system.hpp>
#else
    #include <autom8/device/null_device_system.hpp>
#endif

#include <autom8/net/server.hpp>
#include <autom8/util/ssl_certificate.hpp>
#include <autom8/util/preferences.hpp>
#include <autom8/util/utility.hpp>
#include <autom8/util/debug.hpp>

using namespace autom8;

#define PORT "port"
#define PASSWORD "password"
#define DEFAULT_PASSWORD "defaultchangeme"

MainWindow::MainWindow(QWidget *parent, Qt::WFlags flags)
: QMainWindow(parent, flags)
, mPasswordChanged(false)
{
	ui.setupUi(this);
	bootstrapServer();
	initializeUi();
	connectSignals();
	loadSettings();
	startServerIfDevicesPresent();

#if defined TESTS_ENABLED
	connect(&mStartStopTimer, SIGNAL(timeout()), this, SLOT(onStartStopTimerTick()));
	mStartStopTimer.setInterval(15000);
	mStartStopTimer.start();

	connect(&mClearLogTimer, SIGNAL(timeout()), this, SLOT(onClearLogTimerTick()));
	mClearLogTimer.setInterval(60000);
	mClearLogTimer.start();
#endif
}

MainWindow::~MainWindow() {
	server::stop();
}

void MainWindow::bootstrapServer() {
#if defined(WIN32)
    device_system_ptr deviceSystem(new autom8::cm15a_device_system());
#else
    device_system_ptr deviceSystem(new autom8::null_device_system());
#endif

    device_system::set_instance(deviceSystem);
	server::started.connect(this, &MainWindow::onServerStarted);
    server::stopped.connect(this, &MainWindow::onServerStopped);
}

void MainWindow::startServerIfDevicesPresent() {
	device_list allDevices;
	device_system_ptr deviceSystem = device_system::instance();
	int deviceCount = deviceSystem->model().all_devices(allDevices);
    int port = 7901;
	utility::prefs().get(PORT, port);

	if (deviceCount > 0) {
		server::start(port);
	}
}

autom8::device_ptr MainWindow::getSelectedDevice() {
	QModelIndexList list = 
		ui.DevicesListView->selectionModel()->selectedIndexes();

	return list.count()
		? mDevicesListModel.getDeviceForRow(list[0].row()) : autom8::device_ptr();
}

void MainWindow::connectSignals() {
	connect(ui.StartServerButton, SIGNAL(clicked()), this, SLOT(onStartServerClicked()));
	connect(ui.StopServerButton, SIGNAL(clicked()), this, SLOT(onStopServerClicked()));
	connect(ui.AddDeviceButton, SIGNAL(clicked()), this, SLOT(onAddDeviceClicked()));
	connect(ui.EditDeviceButton, SIGNAL(clicked()), this, SLOT(onEditDeviceClicked()));
	connect(ui.DeleteDeviceButton, SIGNAL(clicked()), this, SLOT(onDeleteDeviceClicked()));
	connect(ui.ClearLogsButton, SIGNAL(clicked()), this, SLOT(onClearLogsButtonClicked()));
	connect(ui.PasswordLineEdit, SIGNAL(textChanged(const QString&)), this, SLOT(onPasswordTextChanged(const QString&)));
	connect(ui.PasswordLineEdit, SIGNAL(returnPressed()), this, SLOT(onPasswordReturnPressed()));

	connect(
		ui.DevicesListView->selectionModel(),
		SIGNAL(selectionChanged(const QItemSelection&, const QItemSelection&)),
		this,
		SLOT(onSelectionChanged(const QItemSelection&, const QItemSelection&)));
}

void MainWindow::initializeUi() {
	mDevicesListModel.refreshDeviceList();
	ui.DevicesListView->setModel(&mDevicesListModel);
	ui.DevicesListView->setColumnWidth(NAME_COLUMN, 120);
	ui.DevicesListView->setColumnWidth(TYPE_COLUMN, 120);
	ui.DevicesListView->setColumnWidth(ADDRESS_COLUMN, 70);
	ui.DevicesListView->setColumnWidth(STATUS_COLUMN, 50);

	ui.LogListView->setModel(&mLogListModel);
	ui.LogListView->setColumnWidth(TIME_COLUMN, 120);

	ui.StopServerButton->setEnabled(false);
	ui.EditDeviceButton->setEnabled(false);
	ui.DeleteDeviceButton->setEnabled(false);

	ui.PasswordLineEdit->installEventFilter(this);

	mTrayIcon = new QSystemTrayIcon(this);
	mTrayIcon->setIcon(QIcon(":/autom8_server_qt/Resources/icon.png"));
	mTrayIcon->setToolTip("autom8 server");
	mTrayIcon->show();

	connect(
		mTrayIcon, SIGNAL(activated(QSystemTrayIcon::ActivationReason)),
		this, SLOT(onTrayIconActivated(QSystemTrayIcon::ActivationReason)));
}

bool MainWindow::eventFilter(QObject* object, QEvent* event) {
	if (object == ui.PasswordLineEdit) {
		if (event->type() == QEvent::FocusIn) {
			ui.PasswordLineEdit->clear();
			mPasswordChanged = false;
		}
		else if (event->type() == QEvent::FocusOut) {
			if (mPasswordChanged) {
				std::string pw = ui.PasswordLineEdit->text().toStdString();
				std::string hash = utility::sha256(pw.c_str(), pw.size());
				autom8::utility::prefs().set(PASSWORD, hash);
			}

			ui.PasswordLineEdit->setText("1234567890");
			mPasswordChanged = false;
		}
	}

	return false;
}

void MainWindow::showBalloon(const QString& message) {
	mTrayIcon->showMessage(
		"autom8 server",
		message,
		QSystemTrayIcon::Information,
		5000);
}

void MainWindow::changeEvent(QEvent* e) {
	if (e->type() == QEvent::WindowStateChange) {
		if (this->windowState() & Qt::WindowMinimized) {
			// needs to be done asynchronously to allow the event queue
			// to finsih processing related commands. 
			QTimer::singleShot(500, this, SLOT(onMinimized()));
		}
	}

	return QMainWindow::changeEvent(e);
}

void MainWindow::closeEvent(QCloseEvent* e) {
	if (server::is_running()) {
		QMessageBox::StandardButton result = QMessageBox::question(
			this,
			QString("autom8 server"),
			QString("The server is still running, are you sure you want to quit now?"),
			QMessageBox::Yes | QMessageBox::No);

		if (result == QMessageBox::No) {
			e->ignore();
		}
	}
}

void MainWindow::onServerStarted() {
	if (thread() != QThread::currentThread()) {
		QMetaObject::invokeMethod(this, "onServerStarted", Qt::QueuedConnection);
		return;
	}

	std::string port, pw;
	utility::prefs().get(PORT, port);
	utility::prefs().get(PASSWORD, pw);

#if DEBUG
	mClient.reset(new client("127.0.0.1", port));
	mClient->connect(pw);
#endif

	ui.StartServerButton->setEnabled(false);
	ui.StopServerButton->setEnabled(true);
	ui.SettingsTab->setEnabled(false);
	ui.ServerStatusLabel->setText("Stop the server to change your settings");
	showBalloon("Server started, now accepting connections.");
}

void MainWindow::onServerStopped() {
	if (thread() != QThread::currentThread()) {
		QMetaObject::invokeMethod(this, "onServerStopped", Qt::QueuedConnection);
		return;
	}

#if DEBUG
	mClient->disconnect();
#endif

	ui.StartServerButton->setEnabled(true);
	ui.StopServerButton->setEnabled(false);
	ui.SettingsTab->setEnabled(true);
	ui.ServerStatusLabel->setText("Press the start button below to start the server.");
	showBalloon("Server stopped, no longer accepting connections.");
}

void MainWindow::onStartServerClicked() {
	saveSettings();
	int port = 7901;
	utility::prefs().get(PORT, port);
	server::start(port);
}

void MainWindow::onStopServerClicked() {
	server::stop();
}

void MainWindow::onEditDeviceClicked() {
	autom8::device_ptr device = getSelectedDevice();

	if (device) {
        EditDeviceDialog dlg(this);
		dlg.setDevice(device);
		if (dlg.exec() == QDialog::Accepted)
		{
			mDevicesListModel.refreshDeviceList();
		}
	}
}

void MainWindow::onAddDeviceClicked() {
    EditDeviceDialog dlg(this);
	if (dlg.exec() == QDialog::Accepted) {
		mDevicesListModel.refreshDeviceList();
	}
}

void MainWindow::onDeleteDeviceClicked() {
	device_ptr device = getSelectedDevice();

	if (device) {
		QMessageBox::StandardButton result = QMessageBox::question(
			this,
			QString("autom8 server"),
				QString("Are you sure you want to delete \"") + 
				QString::fromUtf8(device->label().c_str()) + 
				QString("?\""),
			QMessageBox::Yes | QMessageBox::No);

		if (result == QMessageBox::Yes) {
			autom8::device_system::instance()->model().remove(device);
			mDevicesListModel.refreshDeviceList();
			disableDeviceButtonsIfNoSelection();
		}
	}
}

void MainWindow::onClearLogsButtonClicked() {
	QMessageBox::StandardButton result = QMessageBox::question(
		this,
		QString("autom8 server"),
		QString("Are you sure you want to clear the access logs?"),
		QMessageBox::Yes | QMessageBox::No);

	if (result == QMessageBox::Yes) {
		mLogListModel.clear();
	}
}

void MainWindow::onTrayIconActivated(QSystemTrayIcon::ActivationReason reason) {
	showNormal();
	activateWindow();
	raise();
}

void MainWindow::onMinimized() {
	hide();
	showBalloon("Now running in the background, click the icon to restore.");
}

void MainWindow::onPasswordTextChanged(const QString& text) {
	mPasswordChanged = true;
}

void MainWindow::onPasswordReturnPressed() {
	ui.PasswordLineEdit->clearFocus();
}

void MainWindow::onSelectionChanged(const QItemSelection& selected, const QItemSelection& deselected) {
	disableDeviceButtonsIfNoSelection();
}

void MainWindow::disableDeviceButtonsIfNoSelection() {
	bool hasSelection =
		ui.DevicesListView->selectionModel()->selectedIndexes().count() != 0;

	ui.EditDeviceButton->setEnabled(hasSelection);
	ui.DeleteDeviceButton->setEnabled(hasSelection);
}

void MainWindow::loadSettings() {
    int port = 7901;
    std::string password = DEFAULT_PASSWORD;
	utility::prefs().get(PORT, port);
	utility::prefs().get(PASSWORD, password);

	if ( ! ssl_certificate::exists()) {
        ssl_certificate::generate();
    }

	QString fingerprint = QString::fromUtf8(ssl_certificate::fingerprint().c_str());
	QString controller = QString::fromUtf8(device_system::instance()->description().c_str());

	ui.PortNumberSpinBox->setValue(port);
	ui.PasswordLineEdit->setEchoMode(QLineEdit::PasswordEchoOnEdit);
	ui.PasswordLineEdit->setText("1234567890");
	ui.FingerprintLabel->setText(fingerprint);
	ui.ControllerLabel->setText(controller);

	mPasswordChanged = false;
}

void MainWindow::saveSettings() {
	utility::prefs().set(PORT, ui.PortNumberSpinBox->value());
}

#if defined TESTS_ENABLED
void MainWindow::onStartStopTimerTick() {
	if (server::is_running()) {
		onStopServerClicked();
	}

	onStartServerClicked();
}

void MainWindow::onClearLogTimerTick() {
	mLogListModel.clear();
}
#endif
