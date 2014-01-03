#ifndef AUTOM8_LOG_LIST_MODEL_QT_H
#define AUTOM8_LOG_LIST_MODEL_QT_H

#include <QAbstractItemModel>
#include <QTimer>
#include <boost/thread.hpp>
#include <sigslot/sigslot.h>
#include <sqlite3.h>
#include <vector>
#include <debug.hpp>

#define TIME_COLUMN 0
#define MESSAGE_COLUMN 1

class LogListModel : public QAbstractItemModel, public sigslot::has_slots<> {
	Q_OBJECT

public:
	LogListModel(QObject *parent = NULL);
	~LogListModel();

	virtual int	columnCount(const QModelIndex & parent = QModelIndex()) const;
	virtual QVariant data(const QModelIndex & index, int role = Qt::DisplayRole) const;
	virtual QModelIndex	index(int row, int column, const QModelIndex & parent = QModelIndex()) const;
	virtual QModelIndex	parent(const QModelIndex & index) const;
	virtual int	rowCount(const QModelIndex & parent = QModelIndex()) const;
	virtual QVariant headerData(int section, Qt::Orientation orientation, int role) const;

	void clear();

private:
	void initDbConnection();
	void clearOldEntries();
	void loadEntries();

private slots:
	void onDebugStringLogged(autom8::debug::debug_level level, std::string tag, std::string message);
	void onTimerTick();

private:

    typedef long long ID;

    class LogEntry
	{
    public:
        LogEntry(ID id, sqlite3* connection);
        QString time() const;
        QString message() const;

    private:
        ID mId;
        sqlite3* mConnection;
    };

private:
    std::vector<LogEntry> mEntries;
	std::vector<LogEntry> mPending;
    sqlite3* mConnection;
	QTimer mUpdateTimer;
	mutable boost::mutex mPendingMutex;
};

#endif // AUTOM8_DEVICES_LIST_MODEL_QT_H
