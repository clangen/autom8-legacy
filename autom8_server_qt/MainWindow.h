#ifndef AUTOM8_SERVER_QT_H
#define AUTOM8_SERVER_QT_H

#include <QtGui/QMainWindow>
#include <QSystemTrayIcon>
#include <sigslot/sigslot.h>
#include <devices/device_system.hpp>

#include <client.hpp>

#include "ui_autom8_server_qt.h"

#include "DevicesListModel.h"
#include "LogListModel.h"

//#define TESTS_ENABLED 1

class MainWindow : public QMainWindow, public sigslot::has_slots<> {
	Q_OBJECT

public:
	MainWindow(QWidget *parent = 0, Qt::WFlags flags = 0);
	~MainWindow();

private:
	void bootstrapServer();
	void startServerIfDevicesPresent();
	void connectSignals();
	void initializeUi();
	void loadSettings();
	void saveSettings();
	void showBalloon(const QString& message);
	void disableDeviceButtonsIfNoSelection();
	autom8::device_ptr getSelectedDevice();

protected:
	virtual void changeEvent(QEvent* e);
	virtual void closeEvent(QCloseEvent* e);
	virtual bool eventFilter(QObject *object, QEvent *event); 

private slots:
	void onStartServerClicked();
	void onStopServerClicked();
	void onServerStarted();
	void onServerStopped();
	void onAddDeviceClicked();
	void onEditDeviceClicked();
	void onDeleteDeviceClicked();
	void onClearLogsButtonClicked();
	void onTrayIconActivated(QSystemTrayIcon::ActivationReason reason);
	void onMinimized();
	void onSelectionChanged(const QItemSelection& selected, const QItemSelection& deselected);
	void onPasswordTextChanged(const QString& text);
	void onPasswordReturnPressed();

#if defined TESTS_ENABLED
	void onStartStopTimerTick();
	void onClearLogTimerTick();
#endif

private:
	Ui::autom8_server_qtClass ui;
	DevicesListModel mDevicesListModel;
	LogListModel mLogListModel;
	QSystemTrayIcon *mTrayIcon;
	autom8::client_ptr mClient;
	bool mPasswordChanged;

#if defined TESTS_ENABLED
	QTimer mStartStopTimer, mClearLogTimer;
#endif
};

#endif // AUTOM8_SERVER_QT_H
