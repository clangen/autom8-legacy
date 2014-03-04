#ifndef AUTOM8_DEVICES_LIST_MODEL_QT_H
#define AUTOM8_DEVICES_LIST_MODEL_QT_H

#include <QAbstractItemModel>
#include <autom8/device/device_system.hpp>
#include <sigslot/sigslot.h>
#include <map>

#define NAME_COLUMN 0
#define TYPE_COLUMN 1
#define ADDRESS_COLUMN 2
#define STATUS_COLUMN 3

class DevicesListModel : public QAbstractItemModel, public sigslot::has_slots<> {
	Q_OBJECT

public:
	DevicesListModel(QObject *parent = NULL);
	~DevicesListModel();

	void refreshDeviceList();
	autom8::device_ptr getDeviceForRow(int row);

	virtual int	columnCount(const QModelIndex & parent = QModelIndex()) const;
	virtual QVariant data(const QModelIndex & index, int role = Qt::DisplayRole) const;
	virtual QModelIndex	index(int row, int column, const QModelIndex & parent = QModelIndex()) const;
	virtual QModelIndex	parent(const QModelIndex & index) const;
	virtual int	rowCount(const QModelIndex & parent = QModelIndex()) const;
	virtual QVariant headerData(int section, Qt::Orientation orientation, int role) const;

private slots:
	void onDeviceStatusChanged(autom8::device_ptr device);

private:
	autom8::device_list mDevices;

};

#endif // AUTOM8_DEVICES_LIST_MODEL_QT_H
