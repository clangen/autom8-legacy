#include "message.hpp"
#include "constants.hpp"
#include "debug.hpp"

#include <boost/algorithm/string_regex.hpp>
#include <boost/algorithm/string/split.hpp>

#include <base64/base64.h>

using namespace autom8;
typedef message::message_type message_type;

static const std::string TAG = "message";

message::message()
: type_(message_type_invalid)
, body_(new json_value()) {
}

boost::asio::streambuf& message::read_buffer() {
    return read_buffer_;
}

const json_value& message::body() const {
    return (*body_);
}

message_type message::type() const {
    return type_;
}

const std::string& message::name() const {
    return name_;
}

bool message::parse_message(size_t bytes_read) {
    // read message
    std::string base64_text;
    read_string_from_buffer(base64_text, bytes_read);

    // base 64 decode
    std::string plain_text = base64_decode(base64_text);

    // parse the message. it should consist of two parts: a URI and
    // a body, separated by a MESSAGE_URI_DELIMITER
    std::vector<std::string> split_result;
    boost::regex split_regex(MESSAGE_URI_DELIMITER);
    boost::algorithm::split_regex(split_result, plain_text, split_regex);
    if (split_result.size() != 2) {
        return false;
    }
    //
    std::string uri = split_result[0];
    std::string body = split_result[1];

    // make sure the body is a valid JSON document
    json_reader reader;
    if (( ! reader.parse(body, (*body_)))
    || (body_->type() != json::objectValue)) {
        return false;
    }

    // parse and validate the URI
    boost::cmatch uri_matches;
    boost::regex uri_regex(MESSAGE_URI_REGEX_MATCH);
    if (boost::regex_match(uri.c_str(), uri_matches, uri_regex)) {
        if (uri_matches.size() == 4) {
            // [0] = full string
            // [1] = autom8://
            std::string type_str = uri_matches[2];
            std::string name_str = uri_matches[3];

            if (type_str == MESSAGE_URI_TYPE_REQUEST) {
                this->type_ = message_type_request;
            }
            else if (type_str == MESSAGE_URI_TYPE_RESPONSE) {
                this->type_ = message_type_response;
            }
            else {
                return false;
            }

            name_ = name_str;
            return true;
        }
    }

	debug::log(debug::error, TAG, "could not parse message! " + plain_text);
    return false;
}

void message::read_string_from_buffer(std::string& target, size_t bytes_read) {
    buffer_type buffers = read_buffer_.data();
    buffer_iterator buff_it = boost::asio::buffers_begin(buffers);

    target.assign(buff_it, (buff_it + bytes_read));

    read_buffer_.consume(bytes_read);
}
