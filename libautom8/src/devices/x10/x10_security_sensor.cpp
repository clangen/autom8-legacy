#include <vector>
#include <string>
#include <iostream>

#include <boost/format.hpp>
#include <boost/lexical_cast.hpp>

#include <common_messages.hpp>
#include <server.hpp>
#include <debug.hpp>

#include "x10_security_sensor.hpp"
#include "x10_device_system.hpp"

using namespace autom8;

x10_security_sensor::x10_security_sensor(
    x10_device_system* owner,
    database_id id,
    const std::string& x10_address,
    const std::string& label)
: x10_device(owner, id, x10_address, label)
, is_tripped_(false)
, is_armed_(true) {
}

x10_security_sensor::~x10_security_sensor() {
}

device_type x10_security_sensor::type() {
    return device_type_security_sensor;
}

void x10_security_sensor::get_extended_json_attributes(json_value& target) {
	target["armed"] = is_armed_;
	target["tripped"] = is_tripped_;
}

void x10_security_sensor::arm() {
    is_armed_ = true;
    on_status_changed();
}

void x10_security_sensor::disarm() {
    is_armed_ = false;
    is_tripped_ = false;
    on_status_changed();
}

void x10_security_sensor::reset()
{
    if (is_tripped_) {
        is_tripped_ = false;
        on_status_changed();
    }
}

device_status x10_security_sensor::status()
{
    return (is_tripped_ ? device_status_on : device_status_off);
}

void x10_security_sensor::on_controller_message(const std::vector<std::string>& status_values) {
    if ( ! is_armed_) {
        return;
    }

    std::string type(status_values[2]);
    std::transform(type.begin(), type.end(), type.begin(), tolower);

    if ((type != "off") && ( ! is_tripped_)) {
        is_tripped_ = true;
        on_status_changed();
    }
}

void x10_security_sensor::on_status_changed() {
    device_base::on_status_changed();
    server::send(messages::responses::sensor_status_changed(shared_from_this()));
}
