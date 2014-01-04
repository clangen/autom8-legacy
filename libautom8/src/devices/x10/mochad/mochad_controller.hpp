#ifndef __C_AUTOM8_MOCHAD_DEVICE_CONTROLLER_HPP__
#define __C_AUTOM8_MOCHAD_DEVICE_CONTROLLER_HPP__

#include <boost/asio.hpp>
#include <boost/asio/ssl.hpp>
#include <boost/thread.hpp>
#include <boost/shared_ptr.hpp>
#include <queue>
#include <sigslot/sigslot.h>

namespace autom8 {
    class mochad_controller {
    public:
        sigslot::signal1<std::string> message_received;

        mochad_controller();
        ~mochad_controller();

        bool init();
        void deinit();
        bool send(std::string msg);
        bool requery(const std::string& device_address);

    private:
        void io_thread_proc();

        void start_connecting();

        void handle_resolve(
            const boost::system::error_code&,
            boost::asio::ip::tcp::resolver::iterator
        );

        void handle_connect(
            const boost::system::error_code&,
            boost::asio::ip::tcp::resolver::iterator
        );

        void handle_write(const boost::system::error_code&);
        void handle_read(const boost::system::error_code&, size_t);
        void read_next_message();
        void start_next_write();

    private:
        boost::asio::io_service io_service_;
        boost::asio::ip::tcp::socket socket_;
        boost::asio::ip::tcp::resolver resolver_;
        boost::shared_ptr<boost::thread> io_thread_;
        boost::asio::streambuf read_buffer_;
        std::queue<std::string> write_queue_;
        boost::mutex write_queue_lock_, connection_lock_;
        bool initialized_, connected_, writing_;
    };
}

#endif