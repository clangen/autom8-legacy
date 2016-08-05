#include "stdafx.h"
#include "DevicesListModel.h"

#include <qthread.h>

using namespace autom8;

#define u2q(x) QString::fromUtf8(x.c_str())

static std::map<int, QVariant> sColumnHeaders;
static std::map<device_type, QVariant> sType;
static std::map<device_status, QVariant> sStatus;
static bool sInitialized = false;

static void init() {
	sColumnHeaders[NAME_COLUMN] = QVariant("Name");
	sColumnHeaders[TYPE_COLUMN] = QVariant("Type");
	sColumnHeaders[ADDRESS_COLUMN] = QVariant("Address");
	sColumnHeaders[STATUS_COLUMN] = QVariant("Status");

	sType[device_type_unknown] = QVariant("Unknown");
	sType[device_type_lamp] = QVariant("Lamp");
	sType[device_type_appliance] = QVariant("Appliance");
	sType[device_type_security_sensor] = QVariant("Security Sensor");

	sStatus[device_status_unknown] = QVariant("??");
	sStatus[device_status_off] = QVariant("Off");
	sStatus[device_status_on] = QVariant("On");
}

DevicesListModel::DevicesListModel(QObject *parent)
: QAbstractItemModel(parent)
{
	if ( ! sInitialized)
	{
		init();
		sInitialized = true;
	}
}

DevicesListModel::~DevicesListModel() {
}

autom8::device_ptr DevicesListModel::getDeviceForRow(int index) {
	return mDevices[index];
}

void DevicesListModel::refreshDeviceList() {
    beginResetModel();

    // disconnect from old devices, clear the list
    device_list::iterator it = mDevices.begin();
    for ( ; it != mDevices.end(); it++) {
        (*it)->status_changed.disconnect(this);
    }
    //
    mDevices.clear();

    // requery the device list
    device_system::instance()->model().all_devices(mDevices);

    // attach to all the listeners
    it = mDevices.begin();
    for ( ; it != mDevices.end(); it++) {
        (*it)->status_changed.connect(this, &DevicesListModel::onDeviceStatusChanged);
    }

    // will cause the ListView to requery the model
    endResetModel();
}

void DevicesListModel::onDeviceStatusChanged(autom8::device_ptr device) {
	if (thread() != QThread::currentThread()) {
		QMetaObject::invokeMethod(
			this,
			"onDeviceStatusChanged",
			Qt::QueuedConnection,
			Q_ARG(autom8::device_ptr, device));

		return;
	}

	refreshDeviceList();
}

int	DevicesListModel::columnCount(const QModelIndex & parent) const {
	return (int) sColumnHeaders.size();
}

QVariant DevicesListModel::data(const QModelIndex & index, int role) const {
	if (role == Qt::DisplayRole) {
		device_ptr device = mDevices.at(index.row());

		switch (index.column()) {
		case NAME_COLUMN:
			return QVariant(u2q(device->label()));

		case ADDRESS_COLUMN:
			return QVariant(u2q(device->address()));

		case TYPE_COLUMN:
			return sType.find(device->type())->second;

		case STATUS_COLUMN:
			return sStatus.find(device->status())->second;
		}
	}

	return QVariant();
}

QModelIndex	DevicesListModel::index(int row, int column, const QModelIndex & parent) const {
	return createIndex(row, column);
}

QModelIndex	DevicesListModel::parent(const QModelIndex & index) const {
	return QModelIndex();
}

int	DevicesListModel::rowCount(const QModelIndex & parent) const {
	if (parent == QModelIndex()) {
		return (int) mDevices.size();
	}

	return 0;
}

QVariant DevicesListModel::headerData(int section, Qt::Orientation orientation, int role) const {
	if (role == Qt::DisplayRole) {
		return sColumnHeaders.find(section)->second;
	}

	return QVariant();
}
