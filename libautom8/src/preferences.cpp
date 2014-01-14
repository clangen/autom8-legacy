#include "preferences.hpp"
#include "utility.hpp"
#include "debug.hpp"

#include <boost/format.hpp>

using namespace autom8;

static const std::string TAG = "preferences";

preferences::preferences(const std::string& name)
: connection_(NULL)
, name_(name) {
    std::string filename = utility::settings_directory() + "preferences.db";
    if (sqlite3_open(filename.c_str(), &connection_) != SQLITE_OK) {
        debug::log(debug::error, TAG, "unable to open preferences file!");
        throw std::exception();
    }

    std::string create_table = (boost::format(
        " CREATE TABLE IF NOT EXISTS %1% ("
        " key PRIMARY KEY, "
        " value STRING); ") % name).str();

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
        debug::log(debug::error, TAG, "unable to create preferences table");
        throw std::exception();
    }
}

preferences::~preferences() {
    if (connection_) {
        sqlite3_close(connection_);
        connection_ = NULL;
    }
}
