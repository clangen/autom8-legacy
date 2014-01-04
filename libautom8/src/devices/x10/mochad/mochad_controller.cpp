#include "mochad_controller.hpp"

using namespace autom8;
using boost::asio::ip::tcp;

mochad_controller::mochad_controller()
: socket_(io_service_)
, resolver_(io_service_)
{
    initialized_ = false;
    connected_ = false;
    writing_ = false;

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
    initialized_ = false;
}

void mochad_controller::handle_write(const boost::system::error_code& error) {
    if (error) {
        std::cerr << "socket write failed!\n";
    }

    {
        boost::mutex::scoped_lock lock(write_queue_lock_);
        writing_ = false;
    }

    start_next_write();
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
        socket_,
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
    }

    if (!error) {
        start_next_write();
        read_next_message();
    }
}

void mochad_controller::handle_resolve(
    const boost::system::error_code& error,
    tcp::resolver::iterator endpoint_iterator)
{
    if (!error) {
        socket_.async_connect(
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
        std::cerr << "failed to resolve the mochad service" << std::endl;
    }
}

void mochad_controller::start_connecting() {
    using boost::asio::ip::tcp;

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
}

void mochad_controller::start_next_write() {
    {
        boost::mutex::scoped_lock lock(connection_lock_);

        if (!connected_) {
            // std::cerr << "NOT CONNECTED" << std::endl;
            return;
        }
    }

    boost::mutex::scoped_lock lock(write_queue_lock_);

    // std::cerr << "writing_ " << writing_ << std::endl;
    // std::cerr << "write_queue_.size() " << write_queue_.size() << std::endl;

    writing_ = false;
    if (!writing_ && write_queue_.size() > 0) {
        writing_ = true;

        const std::string command = write_queue_.front();
        write_queue_.pop();

        // std::cerr << "WRITING NOW! " << command << std::endl;

        boost::asio::async_write(
            socket_,
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

        // std::cerr << "queuing write: " << message << std::endl;

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
