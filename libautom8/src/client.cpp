#include "constants.hpp"
#include "debug.hpp"
#include "client.hpp"
#include "ssl_certificate.hpp"
#include "message_formatter.hpp"
#include "message_matcher.hpp"
#include "common_messages.hpp"

#include <ostream>
#include <boost/bind.hpp>

#include <base64/base64.h>

#include <boost/format.hpp>

using namespace autom8;

typedef boost::format format;
static request_ptr ping_(messages::requests::ping());
static response_ptr pong_(messages::responses::pong());
static response_ptr authenticate_(messages::responses::authenticated());
static const std::string TAG = "client";

client::client(const std::string& hostname, const std::string& port)
: hostname_(hostname)
, port_(port)
, io_service_()
, ssl_context_(io_service_, boost::asio::ssl::context::sslv23)
, socket_(io_service_, ssl_context_)
, state_(state_disconnected)
, disconnect_reason_(client::unknown)
{
}

client::~client() {
    disconnect();
}

void client::set_disconnect_reason(reason r) {
    if (disconnect_reason_ == client::unknown) {
        disconnect_reason_ = r;
    }
}

void client::connect(const std::string& password) {
    boost::mutex::scoped_lock lock(state_lock_);

    if (state_ == state_dead) {
        debug::log(debug::error, TAG, "cannot reuse old client, create a new instance");
        throw std::exception();
    }
    else if (state_ != state_disconnected) {
        debug::log(debug::warning, TAG, "connect() called but not disconnected");
        return;
    }

    state_ = state_connecting;
    password_ = password;

    io_service_thread_.reset(
        new boost::thread(
            boost::bind(
                &client::io_service_thread_proc,
                this)));
}

void client::io_service_thread_proc() {
    tcp::resolver resolver(io_service_);
    tcp::resolver::query query(hostname_, port_);

    boost::system::error_code error;
    tcp::resolver::iterator iterator = resolver.resolve(query, error);

    if (error) {
        set_disconnect_reason(connect_failed);
        disconnect("failed to resolve host");
    }
    else {
        ssl_context_.set_verify_mode(boost::asio::ssl::context::verify_peer);
        ssl_context_.set_options(boost::asio::ssl::context::default_workarounds);

        socket_.set_verify_callback(
            boost::bind(&client::verify_certificate, this, _1, _2));

        socket_.lowest_layer().async_connect(
            *iterator,
            boost::bind(
                &client::handle_connect,
                this,
                boost::asio::placeholders::error,
                iterator));

        io_service_.run();
    }

    debug::log(debug::info, TAG, "i/o service thread done");
}

bool client::verify_certificate(bool preverified, boost::asio::ssl::verify_context& ctx) {
#if 0
    // The verify callback can be used to check whether the certificate that is
    // being presented is valid for the peer. For example, RFC 2818 describes
    // the steps involved in doing this for HTTPS. Consult the OpenSSL
    // documentation for more details. Note that the callback is called once
    // for each certificate in the certificate chain, starting from the root
    // certificate authority.

    // In this example we will simply print the certificate's subject name.
    char subject_name[256];
    X509* cert = X509_STORE_CTX_get_current_cert(ctx.native_handle());
    X509_NAME_oneline(X509_get_subject_name(cert), subject_name, 256);
    std::cout << "Verifying " << subject_name << "\n";

    return preverified;
#endif

    return true;
}

void client::disconnect() {
    set_disconnect_reason(client::ok);
    disconnect("clean (external or dtor)");
}

void client::disconnect(const std::string& reason) {
    /*
     * lock it down, check enter disconnecting state
     */
    {
        boost::mutex::scoped_lock lock(state_lock_);

        password_.clear(); // be paranoid. it should already be cleared, but, just in case...

        if (state_ == state_disconnected ||
            state_ == state_disconnecting ||
            state_ == state_dead)
        {
            debug::log(debug::info, TAG, "disconnect called, but already disconnect[ed|ing]");
            return;
        }

        state_ = state_disconnecting;
    }

    debug::log(debug::info, TAG, "disconnect: " + reason);

    /*
     * shut down our i/o service and close the socket
     */
    if (io_service_thread_) {
        io_service_.stop();
        io_service_thread_.reset();
    }

    socket_.lowest_layer().close();

    /*
     * lock it down, kill it
     */
    {
        boost::mutex::scoped_lock lock(state_lock_);
        state_ = state_dead;
    }

    /*
     * notify observers
     */
    disconnected(disconnect_reason_);
}

void client::handle_connect(
    const boost::system::error_code& error,
    tcp::resolver::iterator endpoint_iterator)
{
    if (error) {
        set_disconnect_reason(client::connect_failed);
        disconnect("handled_connect received error");
    }
    else {
        {
            boost::mutex::scoped_lock lock(state_lock_);
            state_ = state_authenticating;
        }

        debug::log(debug::info, TAG, "handled_connect ok, starting handshake");

        socket_.async_handshake(
            boost::asio::ssl::stream_base::client,
            boost::bind(
                &client::handle_handshake,
                this,
                boost::asio::placeholders::error));
    }
}

void client::handle_handshake(const boost::system::error_code& error) {
    if (error) {
        set_disconnect_reason(client::handshake_failed);
        disconnect("handle_handshake received error");
    }
    else {
        std::string pw;

        {
            boost::mutex::scoped_lock lock(state_lock_);
            pw = password_;
            password_.clear();
            state_ = state_authenticating;
        }

        send(messages::requests::authenticate(pw));
        async_read_next_message();
    }
}

void client::handle_next_read_message(message_ptr message, const boost::system::error_code& error, std::size_t size) {
    if (error) {
        set_disconnect_reason(client::read_failed);
        disconnect("handle_next_read_message reported error");
    }
    else {
        if ( ! message->parse_message(size)) {
            debug::log(debug::error, TAG, "message parse failed");
        }

        debug::log(debug::info, TAG, "read message: " + message->name());

        if (message->type() == message::message_type_request) {
            on_recv(request::create(
                "autom8://request/" + message->name(),
                json_value_ref(new json_value(message->body()))));
        }
        else if (message->type() == message::message_type_response) {
            /*
             * convert the raw message to a response
             */
            response_ptr response = response::create(
                "autom8://response/" + message->name(),
                json_value_ref(new json_value(message->body())),
                response::requester_only);

            /*
             * if we're not authenticated, the first response we should receive
             * should be an authentication success. if it's not, then something
             * fishy is going on... bail.
             */
            if (state_ == state_authenticating) {
                if (authenticate_->uri() == response->uri()) {
                    {
                        boost::mutex::scoped_lock lock(state_lock_);
                        state_ = state_connected;
                    }

                    connected(); /* notify observers */
                }
                else {
                    set_disconnect_reason(client::auth_failed);
                    disconnect("auth failed");
                    return;
                }
            }
            else {
                on_recv(response);
            }
        }
        else {
            set_disconnect_reason(client::bad_message);
            disconnect("message parsed, but invalid type?");
            return;
        }

        async_read_next_message();
    }
}

void client::handle_post_send(message_formatter_ptr formatter, const boost::system::error_code& error, std::size_t size) {
    if (error) {
        set_disconnect_reason(client::write_failed);
        disconnect("send() failed");
    }
}

void client::async_read_next_message() {
    message_ptr m(new message());

    boost::asio::async_read_until(
        socket_,
        m->read_buffer(),
        message_matcher(),
        boost::bind(
            &client::handle_next_read_message,
            this,
            m,
            boost::asio::placeholders::error,
            boost::asio::placeholders::bytes_transferred));
}

client::connection_state client::state() {
    return state_;
}

void client::send(response_ptr r) {
    debug::log(debug::info, TAG, "sending response: " + r->uri());
    send(message_formatter::create(r));
}

void client::send(request_ptr r) {
    debug::log(debug::info, TAG, "sending request: " + r->uri());
    send(message_formatter::create(r));
}

void client::send(message_formatter_ptr f) {
    boost::asio::async_write(
        socket_,
        boost::asio::buffer(f->to_string()),
        boost::bind(
            &client::handle_post_send,
            this,
            f,
            boost::asio::placeholders::error,
            boost::asio::placeholders::bytes_transferred));
}

void client::on_recv(response_ptr response) {
    debug::log(debug::info, TAG, "on_recv(response): " + response->uri());
    recv_response(response); /* notify observers */
}

void client::on_recv(request_ptr request) {
    debug::log(debug::info, TAG, "on_recv(request): " + request->uri());

    if (request->uri() == ping_->uri()) {
        send(pong_);
    }
    else {
        recv_request(request); /* notify observers */
    }
}
