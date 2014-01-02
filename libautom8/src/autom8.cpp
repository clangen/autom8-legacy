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

#define VERSION "0.5"
#define DEFAULT_PORT 7901

class console_logger;

static log_func external_logger;
static console_logger* logger = 0;

class console_logger: public autom8::signal_handler {
public:
    console_logger() {
        autom8::debug::string_logged.connect(this, &console_logger::on_string_logged);
    }

    void on_string_logged(autom8::debug::debug_level level, std::string tag, std::string string) {
        using namespace boost::posix_time;
        using namespace boost::gregorian;

		log_func fn = external_logger;
		bool logged = false;

		if (fn) {
			try {
				if (fn) { /* TODO FIX THREAD SAFETY */
					fn((int) level, tag.c_str(), string.c_str());
					logged = true;
				}
			}
			catch (...) {
				/* FIXME */
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

const char* autom8_version() {
	return VERSION;
}

void autom8_set_logger(log_func logger) {
	external_logger = logger;
}

int autom8_server_start() {
	using namespace autom8;

    device_system_ptr cm15a(new autom8::cm15a_device_system());
    device_system::set_instance(cm15a);
		
	if (server::is_running() && !autom8_server_stop()) {
		return -999; /* can't stop server is fatal */
	}

	logger = new console_logger();

    int port = DEFAULT_PORT;
    utility::prefs().get("port", port);

	debug::init();
	server::start(port);

	return 1;
}

int autom8_server_stop() {
	using namespace autom8;

	if (server::stop()) {
		device_system::clear_instance();
		return 1;
	}

	debug::deinit();
	if (logger) {
		delete logger;
		logger = 0;
	}

	return 0;
}



