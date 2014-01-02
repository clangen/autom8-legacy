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
#include "devices/x10/cm15a/cm15a_device_system.hpp"
#include <boost/date_time.hpp>

/* constants */
#define VERSION "0.5"
#define DEFAULT_PORT 7901
#define TAG "c_api"

/* logging */
static log_func external_logger_ = 0;

int autom8_set_logger(log_func logger) {
	external_logger_ = logger;
	return AUTOM8_OK;
}

class console_logger: public autom8::signal_handler {
public:
    console_logger() {
        autom8::debug::string_logged.connect(this, &console_logger::on_string_logged);
    }

    void on_string_logged(autom8::debug::debug_level level, std::string tag, std::string string) {
        using namespace boost::posix_time;
        using namespace boost::gregorian;

		log_func fn = external_logger_;
		bool logged = false;

		if (fn) {
			try {
				if (fn) { /* TODO FIX THREAD SAFETY */
					fn((int) level, tag.c_str(), string.c_str());
					logged = true;
				}
			}
			catch (...) {
				std::cerr << "remote log write failed! result will be dumped to stdout." << std::endl;
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

	default_logger_ = new console_logger();
	autom8::debug::init();
	initialized_ = true;

	return AUTOM8_OK;
}

int autom8_deinit() {
	if (!initialized_) {
		return AUTOM8_NOT_INITIALIZED;
	}

	autom8::server::stop();
	
	/* FIXME: deadlocks */
	/*autom8::debug::deinit();

	if (default_logger_) {
		delete default_logger_;
		default_logger_ = 0;
	}*/

	external_logger_ = 0;
	initialized_ = false;

	return AUTOM8_OK;
}

/* util */
static void respond_with_status(rpc_callback callback, int status_code) {
	using namespace autom8;

	json_value_ref response = json_value_ref(new json_value());
	(*response)["status"] = status_code;
	callback(json_value_to_string(*response).c_str());
}

static void no_op(const char*) {
	/* used when rpc callback not specified */
}

/* prototypes */
static int autom8_server_start();
static int autom8_server_stop();

/* server command handlers */
static void handle_server(autom8::json_value_ref input, rpc_callback callback) {
	std::string command = input->get("command", "").asString();

	if (command == "start") {
		respond_with_status(callback, autom8_server_start());		
	}
	else if (command == "stop") {
		respond_with_status(callback, autom8_server_stop());
	}
	else {
		respond_with_status(callback, AUTOM8_INVALID_COMMAND);
	}
}

int autom8_server_start() {
	using namespace autom8;

    device_system_ptr cm15a(new autom8::cm15a_device_system());
    device_system::set_instance(cm15a);
		
	if (server::is_running() && !autom8_server_stop()) {
		return -999; /* can't stop server is fatal */
	}

    int port = DEFAULT_PORT;
    utility::prefs().get("port", port);

	server::start(port);

	return 1;
}

int autom8_server_stop() {
	using namespace autom8;

	if (server::stop()) {
		device_system::clear_instance();
		return 1;
	}

	return 0;
}

/* generic rpc interface */
void autom8_rpc(const char* input, rpc_callback callback) {
	using namespace autom8;

	callback = (callback ? callback : (rpc_callback) no_op);

	json_value_ref parsed = json_value_from_string(std::string(input));
	const std::string component = parsed->get("component", "").asString();
	const std::string command = parsed->get("command", "").asString();

	debug::log(debug::info, TAG, (std::string("handling '") + component + "' command '" + command));

	if (component == "server") {
		handle_server(parsed, callback);
	}
	else {
		debug::log(debug::error, TAG, std::string("invalid component '") + component + "' specified. rpc call ignored");
	}
}

const char* autom8_version() {
	return VERSION;
}



