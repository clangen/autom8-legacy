#include <vector>
#include <string>
#include <iostream>

#include <boost/lexical_cast.hpp>
#include <boost/format.hpp>

#include <common_messages.hpp>
#include <server.hpp>

#include "x10_device.hpp"
#include "x10_device_system.hpp"

using namespace autom8;

x10_device::x10_device(
    x10_device_system* owner,
    database_id id,
    const std::string& address,
    const std::string& label,
	const std::vector<std::string>& groups)
: device_base()
, owner_(owner)
, id_(id)
, address_(address)
, label_(label)
, status_(device_status_unknown),
 groups_(groups) {
    owner_->requery_device_status(address_);
}

x10_device::~x10_device() {
}

void x10_device::turn_on() {
    set_device_status(device_status_on);
}

void x10_device::turn_off() {
    set_device_status(device_status_off);
}

void x10_device::set_device_status(device_status new_status) {
    server::send(messages::responses::device_status_updating(shared_from_this()));

    std::string command_string = (boost::format("%1% %2%")
    % this->address()
    % (new_status == device_status_off ? "off" : "on")).str();

    owner_->send_device_message(powerline_command, command_string.c_str());
}

void x10_device::groups(std::vector<std::string>& target) {
	std::vector<std::string>::iterator it = groups_.begin();
	for ( ; it != groups_.end(); it++) {
		target.push_back(*it);
	}
}

void x10_device::on_controller_message(const std::vector<std::string>& status_values) {
    std::string type(status_values[2]);
    std::transform(type.begin(), type.end(), type.begin(), tolower);

    // device status
    if ((type == "off") || (type == "on")) {
        status_ = (type == "off") ? device_status_off : device_status_on;
        on_status_changed();
        server::send(messages::responses::device_status_updated(shared_from_this()));
    }
}

device_status x10_device::status() {
    return status_;
}

std::string x10_device::address() {
    return address_;
}

std::string x10_device::label() {
    return label_;
}

device_type x10_device::type() {
    return device_type_unknown;
}

database_id x10_device::id() {
    return id_;
}

void x10_device::update(
    const std::string& new_address,
    const std::string& new_label)
{
    address_ = new_address;
    label_ = new_label;
}

void x10_device::update(
    const std::string& new_address,
    const std::string& new_label,
	const std::vector<std::string>& groups)
{
    address_ = new_address;
    label_ = new_label;
	set_groups(groups);
}

void x10_device::set_groups(const std::vector<std::string>& groups) {
	groups_.assign(groups.begin(), groups.end());
}