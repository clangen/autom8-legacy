#include "stdafx.h"
#include "EditDeviceDialog.h"

#include <QMessageBox>

#include <devices/device_system.hpp>
#include <server.hpp>

#define u2q(x) QString::fromUtf8(x.c_str())

using namespace autom8;

EditDeviceDialog::EditDeviceDialog(QWidget *parent, Qt::WFlags flags)
: QDialog(parent, flags)
{
	ui.setupUi(this);
	connect(ui.OkButton, SIGNAL(clicked()), this, SLOT(onOkClicked()));
}

EditDeviceDialog::~EditDeviceDialog() {
}

void EditDeviceDialog::setDevice(autom8::device_ptr device) {
	mDevice = device;

	if (mDevice)  {
		ui.NameLineEdit->setText(u2q(mDevice->label()));
		ui.AddressLineEdit->setText(u2q(mDevice->address()));

		switch (mDevice->type())
		{
		case autom8::device_type_lamp: ui.TypeComboBox->setCurrentIndex(0); break;
		case autom8::device_type_appliance: ui.TypeComboBox->setCurrentIndex(1); break;
		case autom8::device_type_security_sensor: ui.TypeComboBox->setCurrentIndex(2); break;
		}
	}
}

void EditDeviceDialog::onOkClicked() {
	autom8::device_type type;

	switch (ui.TypeComboBox->currentIndex()) {
	case 0: type = autom8::device_type_lamp; break;
	case 1: type = autom8::device_type_appliance; break;
	case 2: type = autom8::device_type_security_sensor; break;
	}

	QString name = ui.NameLineEdit->text().toLower();
	QString address = ui.AddressLineEdit->text();

	if (name.isEmpty() || address.isEmpty()) {
		QMessageBox::warning(
			this,
			"autom8 server",
			"Please make sure you specify a valid, unique address and name.");

		return;
	}

	autom8::device_model &model = 
		autom8::device_system::instance()->model();

	if (mDevice)  {
		model.update(
			mDevice->id(),
			type,
			address.toLower().toStdString(),
			name.toStdString());

		accept();
	}
	else {
		model.add(type, address.toLower().toStdString(), name.toStdString());
		setResult(QDialog::Accepted);
		accept();
	}
}
