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

class debug_logger: public autom8::signal_handler {
public:
    debug_logger() {
        autom8::debug::string_logged.connect(this, &debug_logger::on_string_logged);
    }

    void on_string_logged(autom8::debug::debug_level, std::string tag, std::string string) {
        using namespace boost::posix_time;
        using namespace boost::gregorian;

        time_facet* facet(new time_facet("[%x %X] "));
        std::cout.imbue(std::locale(std::cout.getloc(), facet));
        ptime time(microsec_clock::local_time());
        std::cout << time << string << std::endl;
    }
};

int main() {
    using namespace autom8;

    debug_logger log;

    int port = 7901;
    utility::prefs().get("port", port);

    device_system_ptr cm15a(new autom8::cm15a_device_system());
    device_system::set_instance(cm15a);

    server::start(port);

    device_system::clear_instance();
}