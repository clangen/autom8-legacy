#ifndef __C_AUTOM8_MOCHAD_DEVICE_CONTROLLER_HPP__
#define __C_AUTOM8_MOCHAD_DEVICE_CONTROLLER_HPP__

#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/thread.hpp>
#include <boost/shared_ptr.hpp>
#include <sigslot/sigslot.h>

namespace autom8 {
    class mochad_controller {
    public:
        sigslot::signal1<std::string> message_received;

        mochad_controller();
        ~mochad_controller();

        bool init();
        void deinit();
        bool send_device_message(const char* message_type, const char* message_params);
        bool get_device_status(const char* device_address);

    private:
        void io_thread_proc();

    private:
        boost::asio::io_service io_service_;
        boost::shared_ptr<boost::thread> io_thread_;
        bool running_;
    };
}

#endif