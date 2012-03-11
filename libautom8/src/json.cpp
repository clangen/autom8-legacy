#include "json.hpp"

#include <boost/lexical_cast.hpp>

namespace autom8 {
    std::string json_value_to_string(const json_value& value) {
        switch (value.type()) {
        case json::stringValue:
        case json::nullValue:
        case json::booleanValue:
            return value.asString();

        case json::intValue:
            return boost::lexical_cast<std::string>(value.asInt());

        case json::uintValue:
            return boost::lexical_cast<std::string>(value.asUInt());

        case json::realValue:
            return boost::lexical_cast<std::string>(value.asDouble());

        default:
            json_writer writer;
            return writer.write(value);
        }
    }
}