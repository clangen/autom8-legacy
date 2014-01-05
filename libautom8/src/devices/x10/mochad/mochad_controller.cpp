#include "mochad_controller.hpp"
#include <debug.hpp>

#define TAG "mochad"
#undef LOG_CONNECTION 0
#undef LOG_SEND 0

using namespace autom8;
using boost::asio::ip::tcp;

mochad_controller::mochad_controller()
: resolver_(io_service_)
, reconnect_timer_(io_service_)
{
    socket_ = NULL;
    initialized_ = false;
    connected_ = false;
    writing_ = false;
    reconnecting_ = false;

    init();
}

mochad_controller::~mochad_controller() {
    deinit();
}

bool mochad_controller::init() {
    if (!initialized_) {
        io_thread_.reset(
            new boost::thread(boost::bind(
                &mochad_controller::io_thread_proc,
                this
            ))
        );

        initialized_ = true;
    }

    return true;
}

void mochad_controller::deinit() {
    io_service_.stop();
    disconnect();
    initialized_ = false;
}

void mochad_controller::disconnect() {
    boost::mutex::scoped_lock lock(connection_lock_);

    debug::log(debug::info, TAG, "disconnected");

    if (socket_) {
        socket_->close();
        delete socket_;
        socket_ = NULL;
    }

    connected_ = false;
    reconnecting_ = false;
    writing_ = false;
}

void mochad_controller::schedule_reconnect() {
    boost::mutex::scoped_lock lock(connection_lock_);

    if (!connected_ && !reconnecting_) {
#ifdef LOG_CONNECTION
        std::cerr << "scheduling reconnect..." << std::endl;
#endif

        debug::log(debug::info, TAG, "scheduling reconnect in 10 seconds");
        reconnect_timer_.expires_from_now(boost::posix_time::seconds(10));

        reconnect_timer_.async_wait(boost::bind(
            &mochad_controller::start_connecting, this
        ));

        reconnecting_ = true;
    }
}

void mochad_controller::handle_write(const boost::system::error_code& error) {
    {
        boost::mutex::scoped_lock lock(write_queue_lock_);
        writing_ = false;
    }

    if (error) {
#ifdef LOG_CONNECTION
        std::cerr << "socket write failed!\n";
#endif

        {
            boost::mutex::scoped_lock lock(connection_lock_);
            connected_ = false;
        }

        schedule_reconnect();
    }
    else {
        start_next_write();
    }
}

void mochad_controller::handle_read(const boost::system::error_code& error, size_t size) {
    if (!error) {
        std::istream is(&read_buffer_);
        std::string line;
        std::getline(is, line);
        message_received(line);
    }

    read_next_message();
}

void mochad_controller::read_next_message() {
    boost::asio::async_read_until(
        *socket_,
        read_buffer_,
        '\n',
        boost::bind(
            &mochad_controller::handle_read,
            this,
            boost::asio::placeholders::error,
            boost::asio::placeholders::bytes_transferred
        )
    );
}

void mochad_controller::handle_connect(
    const boost::system::error_code& error,
    tcp::resolver::iterator endpoint_iterator)
{
    {
        boost::mutex::scoped_lock lock(connection_lock_);
        connected_ = error ? false : true;
        reconnecting_ = false;
    }

    if (!error) {
#ifdef LOG_CONNECTION
        std::cerr << "connected..." << std::endl;
#endif

        debug::log(debug::info, TAG, "connected to socket");
        send("\n"); /* tests the socket */
        start_next_write();
        read_next_message();
    }
    else {
#ifdef LOG_CONNECTION
        std::cerr << "connection failed..." << std::endl;
#endif

        schedule_reconnect();
    }
}

void mochad_controller::handle_resolve(
    const boost::system::error_code& error,
    tcp::resolver::iterator endpoint_iterator)
{
    if (!error) {
#ifdef LOG_CONNECTION
        std::cerr << "resolved..." << std::endl;
#endif

        socket_ = new tcp::socket(io_service_);

        socket_->async_connect(
            *endpoint_iterator,
            boost::bind(
                &mochad_controller::handle_connect,
                this,
                boost::asio::placeholders::error,
                endpoint_iterator
            )
        );
    }
    else {
#ifdef LOG_CONNECTION
        std::cerr << "resolve failed..." << std::endl;
#endif

        schedule_reconnect();
    }
}

void mochad_controller::start_connecting() {
#ifdef LOG_CONNECTION
    std::cerr << "start_connecting() entered..." << std::endl;
#endif

    {
        boost::mutex::scoped_lock lock(connection_lock_);

        if (connected_) {
#ifdef LOG_CONNECTION
            std::cerr << "already connected, done..." << std::endl;
#endif

            return;
        }

        reconnecting_ = false;
    }

#ifdef LOG_CONNECTION
    std::cerr << "connecting now..." << std::endl;
#endif

    tcp::resolver::query query("127.0.0.1", "1099");

    resolver_.async_resolve(
        query,
        boost::bind(
            &mochad_controller::handle_resolve,
            this,
            boost::asio::placeholders::error,
            boost::asio::placeholders::iterator
        )
    );
}

void mochad_controller::io_thread_proc() {
    start_connecting();
    io_service_.run();
    disconnect();
}

void mochad_controller::start_next_write() {
    {
        boost::mutex::scoped_lock lock(connection_lock_);

        if (!connected_) {
#ifdef LOG_SEND
            std::cerr << "write staying in queue, not connected" << std::endl;
#endif
            return;
        }
    }

    boost::mutex::scoped_lock lock(write_queue_lock_);

    writing_ = false;
    if (!writing_ && write_queue_.size() > 0) {
        writing_ = true;

        const std::string command = write_queue_.front();
        write_queue_.pop();

#ifdef LOG_SEND
        std::cerr << "writing to socket now! " << command << std::endl;
#endif

        boost::asio::async_write(
            *socket_,
            boost::asio::buffer(command.c_str(), command.size()),
            boost::bind(
                &mochad_controller::handle_write,
                this,
                boost::asio::placeholders::error
            )
        );
    }
}

bool mochad_controller::send(std::string message) {
    unsigned len = message.size();
    if (len > 0) {
        if (message[len - 1] != '\n') {
            message += '\n';
        }

#ifdef LOG_SEND
        std::cerr << "queuing write: " << message << std::endl;
#endif

        {
            boost::mutex::scoped_lock lock(write_queue_lock_);
            write_queue_.push(message);
        }

        start_next_write();
    }

    return true;
}

bool mochad_controller::requery(const std::string& address) {
    return true;
}
