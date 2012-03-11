#include "device_model.hpp"
#include <utility.hpp>
#include <debug.hpp>
#include <boost/format.hpp>
#include <boost/lexical_cast.hpp>

using namespace autom8;

#define ID_COLUMN "id"
#define ADDRESS_COLUMN "address"
#define TYPE_COLUMN "type"
#define LABEL_COLUMN "label"

static const std::string TAG = "device_model";

device_model::device_model(device_factory_ptr factory)
: factory_(factory)
, connection_(NULL) {
    table_name_ = factory_->name() + "_device";

    // connect to the db.
    std::string filename = utility::settings_directory() + "devices.db";
    if (sqlite3_open(filename.c_str(), &connection_) != SQLITE_OK) {
        debug::log(debug::error, TAG, "unable to open devices database!");
        throw std::exception();
    }

    create_table();
}

device_model::~device_model() {
    if (connection_) {
        sqlite3_close(connection_);
        connection_ = NULL;
    }
}

void device_model::create_table() {
    std::string create_table = (boost::format(
        " CREATE TABLE IF NOT EXISTS %1% ("
        " %2% INTEGER PRIMARY KEY AUTOINCREMENT, "
        " %3% INTEGER, "
        " %4% STRING UNIQUE, "
        " %5% STRING); ")
        % table_name_
        % ID_COLUMN
        % TYPE_COLUMN
        % ADDRESS_COLUMN
        % LABEL_COLUMN).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare_v2(
        connection_,
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
}

device_ptr device_model::add(
    device_type type,
    const std::string& address,
    const std::string& label)
{
    device_ptr device;

    std::string insert_row = (boost::format(
        " INSERT INTO %1% (%2%, %3%, %4%, %5%)"
        " VALUES(NULL, ?, ?, ?);")
        % table_name_
        % ID_COLUMN
        % TYPE_COLUMN
        % ADDRESS_COLUMN
        % LABEL_COLUMN).str();

    {
        boost::mutex::scoped_lock lock(connection_mutex_);

        sqlite3_stmt* stmt = NULL;

        int result = sqlite3_prepare(
            connection_,
            insert_row.c_str(),
            (int) insert_row.size(),
            &stmt,
            NULL);

        if (result == SQLITE_OK) {
            sqlite3_bind_int(stmt, 1, type);
            sqlite3_bind_text(stmt, 2, address.c_str(), -1, SQLITE_STATIC);
            sqlite3_bind_text(stmt, 3, label.c_str(), -1, SQLITE_STATIC);

            result = sqlite3_step(stmt);
        }

        if (result == SQLITE_DONE) {
            device = factory_->create(
                sqlite3_last_insert_rowid(connection_),
                type,
                address,
                label);
        }
    }

    if (device) {
        on_device_added(device);
    }

    return device;
}

bool device_model::remove(device_ptr device) {
    return remove(device->id());
}

bool device_model::remove(database_id id) {
    bool result = false;

    std::string delete_device = (boost::format(
        " DELETE FROM %1%"
        " WHERE %2%=?;")
        % table_name_
        % ID_COLUMN).str();

    {
        boost::mutex::scoped_lock lock(connection_mutex_);

        sqlite3_stmt* stmt = NULL;

        int result = sqlite3_prepare(
            connection_,
            delete_device.c_str(),
            (int) delete_device.size(),
            &stmt,
            NULL);

        if (result == SQLITE_OK) {
            sqlite3_bind_int64(stmt, 1, id);
            result = sqlite3_step(stmt);
        }

        if (result == SQLITE_DONE) {
            result = true;
        }
    }

    if (result) {
        on_device_removed(id);
    }

    return result;
}

bool device_model::update(device_ptr device) {
    return this->update(
        device->id(),
        device->type(),
        device->address(),
        device->label());
}

bool device_model::update(
    database_id id,
    device_type type,
    const std::string& address,
    const std::string& label)
{
    std::string query = (boost::format(
        " UPDATE %1%"
        " SET %2%=?, %3%=?, %4%=?"
        " WHERE %5%=?;")
        % table_name_
        % TYPE_COLUMN
        % ADDRESS_COLUMN
        % LABEL_COLUMN
        % ID_COLUMN).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        connection_,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, type);
        sqlite3_bind_text(stmt, 2, address.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 3, label.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_int64(stmt, 4, id);

        result = sqlite3_step(stmt);
    }

    sqlite3_finalize(stmt);

    if (result == SQLITE_DONE) {
        on_device_updated(id);
        return true;
    }

    return false;
}

device_ptr device_model::find_by_address(const std::string& address) {
    device_ptr device;

    std::string query = (boost::format(
        " SELECT %1%, %2%, %3%, %4%"
        " FROM %5%"
        " WHERE address=?;")
        % ID_COLUMN
        % TYPE_COLUMN
        % ADDRESS_COLUMN
        % LABEL_COLUMN
        % table_name_).str();

    sqlite3_stmt* stmt = NULL;

    int result = sqlite3_prepare(
        connection_,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, address.c_str(), -1, SQLITE_STATIC);

        if(sqlite3_step(stmt) == SQLITE_ROW) {
            database_id id = (database_id) sqlite3_column_int64(stmt, 0);
            device_type type = (device_type) sqlite3_column_int(stmt, 1);
            std::string address((const char*) sqlite3_column_text(stmt, 2));
            std::string label((const char*) sqlite3_column_text(stmt, 3));

            device = factory_->create(id, type, address, label);
        }
    }

    sqlite3_finalize(stmt);

    return device;
}

int device_model::all_devices(device_list& list) {
    std::string query = (boost::format(
        " SELECT %1%, %2%, %3%, %4%"
        " FROM %5%"
        " ORDER BY %3%;")
        % ID_COLUMN
        % TYPE_COLUMN
        % ADDRESS_COLUMN
        % LABEL_COLUMN
        % table_name_).str();

    sqlite3_stmt* stmt = NULL;

    int count = 0;
    int result = sqlite3_prepare(
        connection_,
        query.c_str(),
        (int) query.size(),
        &stmt,
        NULL);

    if (result == SQLITE_OK) {
        while ((result = sqlite3_step(stmt)) == SQLITE_ROW) {
            database_id id = (database_id) sqlite3_column_int64(stmt, 0);
            device_type type = (device_type) sqlite3_column_int(stmt, 1);
            std::string address((const char*) sqlite3_column_text(stmt, 2));
            std::string label((const char*) sqlite3_column_text(stmt, 3));

            list.push_back(factory_->create(id, type, address, label));
            ++count;
        }
    }

    sqlite3_finalize(stmt);

    return count;
}

void device_model::on_device_added(device_ptr new_device)
{
    device_added(new_device);
}

void device_model::on_device_removed(database_id old_device_id)
{
    device_removed(old_device_id);
}

void device_model::on_device_updated(database_id id)
{
    device_updated(id);
}
