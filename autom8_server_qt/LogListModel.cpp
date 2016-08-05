#include "stdafx.h"
#include "LogListModel.h"

#include <QDate>

#include <boost/format.hpp>

#include <autom8/util/utility.hpp>
#include <autom8/util/debug.hpp>

using namespace autom8;

#define u2q(x) QString::fromUtf8(x.c_str())

static std::map<int, QVariant> sColumnHeaders;
static bool sInitialized = false;

#define DB_TABLE_NAME "log"
#define DB_ID_COLUMN "id"
#define DB_TIME_COLUMN "time"
#define DB_MESSAGE_COLUMN "message"
#define MAX_LOG_SIZE 2000

static int sLastDayOfYear = -1;
static bool sInTransaction = false;

static const std::string TAG = "LogListModel";

static void init() {
	sColumnHeaders[TIME_COLUMN] = QVariant("Time");
	sColumnHeaders[MESSAGE_COLUMN] = QVariant("Message");
}

#define EXEC_SQL(connection, str)				\
	{											\
		sqlite3_stmt* stmt = NULL;				\
		std::string query(str);					\
												\
		int result = sqlite3_prepare_v2(		\
			connection,							\
			query.c_str(),						\
			(int) query.size(),					\
			&stmt,								\
			NULL);								\
												\
		if (result == SQLITE_OK) {				\
			result = sqlite3_step(stmt);		\
		}										\
												\
		sqlite3_finalize(stmt);					\
	}											\

static void beginTransaction(sqlite3* connection) {
	if ( ! sInTransaction) {
		EXEC_SQL(connection, "BEGIN TRANSACTION;");
		sInTransaction = true;
	}
}

static void endTransaction(sqlite3* connection) {
	if (sInTransaction) {
		EXEC_SQL(connection, "COMMIT TRANSACTION;");
		sInTransaction = false;
	}
}

LogListModel::LogListModel(QObject *parent)
: QAbstractItemModel(parent)
{
	if ( ! sInitialized) {
		init();
		sInitialized = true;
	}

    debug::string_logged.connect(this, &LogListModel::onDebugStringLogged);

	connect(&mUpdateTimer, SIGNAL(timeout()), this, SLOT(onTimerTick()));
	mUpdateTimer.setInterval(2500);
	mUpdateTimer.start();

	initDbConnection();
	beginTransaction(mConnection);
}

LogListModel::~LogListModel() {
	debug::string_logged.disconnect(this);
	sqlite3_close(mConnection);
}

void LogListModel::initDbConnection() {
    // connect to the db.
    std::string filename = utility::settings_directory() + "access_logs.db";
    if (sqlite3_open(filename.c_str(), &mConnection) != SQLITE_OK) {
        debug::log(debug::error, TAG, "unable to open log database");
        throw std::exception();
    }

    // create the table
    std::string create_table = (boost::format(
        " CREATE TABLE IF NOT EXISTS %1% ("
        " %2% INTEGER PRIMARY KEY AUTOINCREMENT, "
        " %3% INTEGER, "
        " %4% STRING); ")
        % DB_TABLE_NAME
        % DB_ID_COLUMN
        % DB_TIME_COLUMN
        % DB_MESSAGE_COLUMN).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare_v2(
        mConnection,
        create_table.c_str(),
        (int) create_table.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        result = sqlite3_step(stmt);
    }

    sqlite3_finalize(stmt);

    if (result != SQLITE_DONE) {
        debug::log(debug::error, TAG, "unable to create devices table");
        throw std::exception();
    }

	// will clear, then implicitly load entries
    clearOldEntries();
}

void LogListModel::clearOldEntries() {
	std::string delete_older_than_a_week =
		(boost::format(
			"DELETE FROM %1% WHERE %2% < strftime('%%J', 'now', '-2 days');")
			% DB_TABLE_NAME
			% DB_TIME_COLUMN).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        mConnection,
        delete_older_than_a_week.c_str(),
        (int) delete_older_than_a_week.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        result = sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

	sLastDayOfYear = QDate::currentDate().dayOfYear();

	loadEntries();
}

void LogListModel::clear() {
    bool success = false;

    std::string delete_all =
        (boost::format("DELETE FROM %1%;") % DB_TABLE_NAME).str();

    {
        sqlite3_stmt* stmt = NULL;

        int result = sqlite3_prepare(
            mConnection,
            delete_all.c_str(),
            (int) delete_all.size(),
            &stmt,
            NULL);

		{
			if (result == SQLITE_OK) {
				result = sqlite3_step(stmt);
				sqlite3_finalize(stmt);
			}

			success = (result == SQLITE_DONE);

			if (success) {
				std::string vacuum = "VACUUM";

				result = sqlite3_prepare(
					mConnection,
					vacuum.c_str(),
					(int) vacuum.size(),
					&stmt,
					NULL);

				if (result == SQLITE_OK) {
					result = sqlite3_step(stmt);
					sqlite3_finalize(stmt);
				}
			}
		}
    }

    if (success) {
        beginResetModel();
        mEntries.clear();
		mPending.clear();
        endResetModel();
    }
}

void LogListModel::loadEntries() {
    beginResetModel();

    mEntries.clear();
	mPending.clear();

    std::string query = (boost::format(
        " SELECT %1%"
        " FROM %2%"
        " ORDER BY %3% ASC"
		" LIMIT %4%;")
        % DB_ID_COLUMN
        % DB_TABLE_NAME
        % DB_TIME_COLUMN
		% MAX_LOG_SIZE).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        mConnection,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        while ((result = sqlite3_step(stmt)) == SQLITE_ROW) {
            ID id = (ID) sqlite3_column_int64(stmt, 0);
            mEntries.insert(mEntries.begin(), LogEntry(id, mConnection));
        }
    }

    sqlite3_finalize(stmt);

    endResetModel();
}

void LogListModel::onDebugStringLogged(autom8::debug::debug_level level, std::string tag, std::string message) {
	// if the day has changed since the last cleared old entries, go
	// ahead and clear them now. this isn't bullet proof, but will work
	// most of the time.
	if (QDate::currentDate().dayOfYear() != sLastDayOfYear) {
		clearOldEntries();
	}

	std::string levelStr = "[W]";
	switch (level) {
	case autom8::debug::info: levelStr = "[I]"; break;
	case autom8::debug::warning: levelStr = "[W]"; break;
	case autom8::debug::error: levelStr = "[E]"; break;
	}

	message = levelStr + " [" + tag + "] " + message;

    std::string insert_row = (boost::format(
		" INSERT INTO %1% (%2%, %3%, %4%)"
		" VALUES(NULL, julianday('now'), ?);")
		% DB_TABLE_NAME
		% DB_ID_COLUMN
		% DB_TIME_COLUMN
		% DB_MESSAGE_COLUMN).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        mConnection,
        insert_row.c_str(),
        (int) insert_row.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, message.c_str(), -1, SQLITE_STATIC);
        result = sqlite3_step(stmt);

		if (result == SQLITE_DONE) {
			boost::mutex::scoped_lock lock(mPendingMutex);

			ID id = sqlite3_last_insert_rowid(mConnection);
            mPending.push_back(LogEntry(id, mConnection));
		}
    }

    if (stmt) {
        sqlite3_finalize(stmt);
    }
}

void LogListModel::onTimerTick() {
	if (mPending.size() > 0) {
        beginResetModel();

		{
			boost::mutex::scoped_lock lock(mPendingMutex);

			for (size_t i = 0; i < mPending.size(); i++) {
				mEntries.insert(mEntries.begin(), mPending[i]);
			}

			const int toRemove = ((int) mEntries.size() - MAX_LOG_SIZE);
			for (int i = toRemove; i > 0; i--) {
				mEntries.pop_back();
			}

			mPending.clear();
		}

		endTransaction(mConnection);
        endResetModel();

		beginTransaction(mConnection);
	}
}

int	LogListModel::columnCount(const QModelIndex & parent) const {
	return (int) sColumnHeaders.size();
}

QVariant LogListModel::data(const QModelIndex & index, int role) const {
	if (role == Qt::DisplayRole) {
		switch (index.column())
		{
		case TIME_COLUMN:
			return QVariant(mEntries[index.row()].time());

		case MESSAGE_COLUMN:
			return QVariant(mEntries[index.row()].message());
		}
	}

	return QVariant();
}

QModelIndex	LogListModel::index(int row, int column, const QModelIndex & parent) const {
	return createIndex(row, column);
}

QModelIndex	LogListModel::parent(const QModelIndex & index) const {
	return QModelIndex();
}

int	LogListModel::rowCount(const QModelIndex & parent) const {
	if (parent == QModelIndex())
	{
		return (int) mEntries.size();
	}

	return 0;
}

QVariant LogListModel::headerData(int section, Qt::Orientation orientation, int role) const {
	if (role == Qt::DisplayRole)
	{
		return sColumnHeaders.find(section)->second;
	}

	return QVariant();
}

//////////////////

inline QString QueryColumnString(sqlite3* connection, long long id, const char* column) {
    QString value;

    std::string query = (boost::format(
        " SELECT %1%"
        " FROM %2%"
        " WHERE id=%3%;")
        % column
        % DB_TABLE_NAME
        % id).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        connection,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        result = sqlite3_step(stmt);

        if (result == SQLITE_ROW) {
			value = QString::fromUtf8((const char *) sqlite3_column_text(stmt, 0));
        }
    }

    sqlite3_finalize(stmt);

    return value;
}

inline QString QueryColumnTime(sqlite3* connection, long long id, const char* column) {
    QString value;

    std::string query = (boost::format(
        " SELECT datetime(%1%, 'localtime')"
        " FROM %2%"
        " WHERE id=%3%;")
        % column
        % DB_TABLE_NAME
        % id).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        connection,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        result = sqlite3_step(stmt);

        if (result == SQLITE_ROW) {
			value = QString::fromUtf8((const char *) sqlite3_column_text(stmt, 0));
        }
    }

    sqlite3_finalize(stmt);

    return value;
}

LogListModel::LogEntry::LogEntry(ID id, sqlite3* connection)
: mId(id)
, mConnection(connection)
{
}

QString LogListModel::LogEntry::time() const {
    return QueryColumnTime(mConnection, mId, DB_TIME_COLUMN);
}

QString LogListModel::LogEntry::message() const {
    return QueryColumnString(mConnection, mId, DB_MESSAGE_COLUMN);
}
