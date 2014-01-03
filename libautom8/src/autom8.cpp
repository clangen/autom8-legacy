#include "autom8.hpp"

#include <iostream>

#include "signal_handler.hpp"
#include "constants.hpp"

#include "message.hpp"
#include "response.hpp"
#include "request_handler_factory.hpp"
#include "request_handler_registrar.hpp"

#include "server.hpp"
#include "session.hpp"
#include "server.hpp"
#include "debug.hpp"
#include "utility.hpp"

#include "autom8.hpp"
#include "devices/null_device_system.hpp"
#include <boost/date_time.hpp>
#include <boost/thread/thread.hpp>

using namespace autom8;

/* constants */
#define VERSION "0.5"
#define DEFAULT_PORT 7901
#define TAG "c_api"

/* logging */
static log_func external_logger_ = 0;
static boost::mutex external_logger_mutex_;

int autom8_set_logger(log_func logger) {
    boost::mutex::scoped_lock lock(external_logger_mutex_);
    external_logger_ = logger;
    return AUTOM8_OK;
}

class console_logger: public signal_handler {
public:
    console_logger() {
        debug::string_logged.connect(this, &console_logger::on_string_logged);
    }

    void on_string_logged(debug::debug_level level, std::string tag, std::string string) {
        using namespace boost::posix_time;
        using namespace boost::gregorian;
        bool logged = false;

        {
            boost::mutex::scoped_lock lock(external_logger_mutex_);

            if (external_logger_) {
                try {
                    if (external_logger_) {
                        external_logger_((int) level, tag.c_str(), string.c_str());
                        logged = true;
                    }
                }
                catch (...) {
                    std::cerr << "remote log write failed! result will be dumped to stdout." << std::endl;
                }
            }
        }

         /* external process couldn't handle logging. dump to stdout! */
        if (!logged) {
            time_facet* facet(new time_facet("--> [%x %X] "));
            std::cout.imbue(std::locale(std::cout.getloc(), facet));
            ptime time(microsec_clock::local_time());
            std::cout << time << string << std::endl;
        }
    }
};

static console_logger* default_logger_ = 0;

/* init, deinit */
static bool initialized_ = false;

int autom8_init() {
    if (initialized_) {
        return AUTOM8_ALREADY_INITIALIZED;
    }

    {
        boost::mutex::scoped_lock lock(external_logger_mutex_);
        default_logger_ = new console_logger();
        debug::init();
    }

    initialized_ = true;

    return AUTOM8_OK;
}

int autom8_deinit() {
    if (!initialized_) {
        return AUTOM8_NOT_INITIALIZED;
    }

    server::stop();

    {
        boost::mutex::scoped_lock lock(external_logger_mutex_);
        debug::deinit();

        if (default_logger_) {
            delete default_logger_;
            default_logger_ = 0;
        }
    }

    external_logger_ = 0;
    initialized_ = false;

    return AUTOM8_OK;
}

/* util */
static void respond_with_status(rpc_callback callback, int status_code) {
    json_value_ref response = json_value_ref(new json_value());
    (*response)["status"] = status_code;
    callback(json_value_to_string(*response).c_str());
}

static void respond_with_status(rpc_callback callback, const std::string& errmsg) {
    json_value error;
    error["error"] = errmsg;

    json_value_ref response = json_value_ref(new json_value());
    (*response)["status"] = AUTOM8_UNKNOWN;
    (*response)["message"] = error;
    callback(json_value_to_string(*response).c_str());
}

static void respond_with_status(rpc_callback callback, json_value_ref json) {
    json_value_ref response = json_value_ref(new json_value());
    (*response)["status"] = AUTOM8_UNKNOWN;
    (*response)["message"] = *json;
    callback(json_value_to_string(*response).c_str());
}

static void no_op(const char*) {
    /* used when rpc callback not specified */
}

/* server command handlers */
static int server_start();
static int server_stop();
static int server_set_preference(json_value& options);
static json_value_ref server_get_preference(json_value& options);

static void handle_server(json_value_ref input, rpc_callback callback) {
    std::string command = input->get("command", "").asString();
    json_value options = input->get("options", json_value());

    if (command == "start") {
        respond_with_status(callback, server_start());
    }
    else if (command == "stop") {
        respond_with_status(callback, server_stop());
    }
    else if (command == "set_preference") {
        respond_with_status(callback, server_set_preference(options));
    }
    else {
        respond_with_status(callback, AUTOM8_INVALID_COMMAND);
    }
}

int server_set_preference(json_value& options) {
    std::string key = options.get("key", "").asString();
    std::string value = options.get("value", "").asString();

    if (key.size() == 0 || value.size() == 0) {
        return AUTOM8_INVALID_ARGUMENT;
    }

    return (utility::prefs().set(key, value) ? AUTOM8_OK : AUTOM8_UNKNOWN);
}

int server_start() {
    device_system::set_instance(
        device_system_ptr(new null_device_system())
    );

    if (server::is_running() && !server_stop()) {
        return -999; /* can't stop server is fatal */
    }

    int port = DEFAULT_PORT;
    utility::prefs().get("port", port);

    server::start(port);

    return 1;
}

int server_stop() {
    if (server::stop()) {
        device_system::clear_instance();
        return 1;
    }

    return 0;
}

/* system command handlers */
static json_value_ref system_list() {
    json_value list = json_value(Json::arrayValue);
    list.append("cm15a");
    list.append("null/mock");

    json_value_ref result(new json_value());
    (*result)["systems"] = list;
    return result;
}

static json_value_ref system_current() {
    json_value_ref result(new json_value());
    (*result)["system_id"] = "null/mock";
    return result;
}

static json_value_ref system_list_devices() {
    device_system& ds = *device_system::instance();
    device_model& model = ds.model();
    device_list devices;
    model.all_devices(devices);

    json_value list = json_value(Json::arrayValue);
    for (size_t i = 0; i < devices.size(); i++) {
        list.append(*(devices.at(i)->to_json()));
    }

    json_value_ref result(new json_value());
    (*result)["devices"] = list;
    return result;
}

static json_value_ref system_add_device(json_value& options) {
    std::string label = options.get("label", "").asString();
    std::string address = options.get("address", "").asString();
    device_type type = (device_type) options.get("type", (int) device_type_unknown).asInt();
    std::vector<std::string> groups; /* TODO */

    device_model& model = device_system::instance()->model();
    device_ptr device = model.add(type, address, label, groups);

    json_value_ref result(new json_value());

    if (device) {
        (*result)["device"] = *(device->to_json());
    }
    else {
        (*result)["error"] = "failed to create device";
    }

    return result;
}

static void handle_system(json_value_ref input, rpc_callback callback) {
    std::string command = input->get("command", "").asString();
    json_value options = input->get("options", json_value());

    if (command == "list") {
        respond_with_status(callback, system_list());
    }
    else if (command == "current") {
        respond_with_status(callback, system_current());
    }
    else if (command == "list_devices") {
        respond_with_status(callback, system_list_devices());
    }
    else if (command == "add_device") {
        respond_with_status(callback, system_add_device(options));
    }
    else {
        respond_with_status(callback, AUTOM8_INVALID_COMMAND);
    }
}

/* generic rpc interface */
void autom8_rpc(const char* input, rpc_callback callback) {
    callback = (callback ? callback : (rpc_callback) no_op);
    json_value_ref parsed;

    try {
        parsed = json_value_from_string(std::string(input));
    }
    catch (...) {
        /* we will return in a sec */
    }

    if (!parsed) {
        debug::log(debug::error, TAG, "autom8_rpc input parse failed");
        respond_with_status(callback, AUTOM8_PARSE_ERROR);
        return;
    }

    const std::string component = parsed->get("component", "").asString();
    const std::string command = parsed->get("command", "").asString();

    debug::log(debug::info, TAG, (std::string("handling '") + component + "' command '" + command + "'"));

    if (component == "server") {
        handle_server(parsed, callback);
    }
    else if (component == "system") {
        handle_system(parsed, callback);
    }
    else {
        debug::log(debug::error, TAG, std::string("invalid component '") + component + "' specified. rpc call ignored");
    }
}

const char* autom8_version() {
    return VERSION;
}



