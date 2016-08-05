#ifndef AUTOM8_SERVER_EDIT_DEVICE_DIALOG_QT_H
#define AUTOM8_SERVER_EDIT_DEVICE_DIALOG_QT_H

#include <QtWidgets/QMainWindow>
#include <sigslot/sigslot.h>

#include <autom8/device/device_base.hpp>

#include "ui_autom8_server_edit_device.h"

class EditDeviceDialog : public QDialog, public sigslot::has_slots<> {
	Q_OBJECT

public:
	EditDeviceDialog(QWidget *parent = 0, Qt::WindowFlags flags = 0);
	~EditDeviceDialog();

	void setDevice(autom8::device_ptr device);

private slots:
	void onOkClicked();

private:
	Ui_autom8_server_edit_device ui;
	autom8::device_ptr mDevice;
};

#endif // AUTOM8_SERVER_EDIT_DEVICE_DIALOG_QT_H
