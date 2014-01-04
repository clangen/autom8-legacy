#include "mochad_device_system.hpp"
#include "mochad_controller.hpp"

#include <boost/thread.hpp>

#include <devices/device_model.hpp>
#include <devices/x10/x10_device_factory.hpp>

#include <utility.hpp>

#include <vector>
#include <string>
#include <iostream>
#include <set>

using namespace autom8;

mochad_device_system::mochad_device_system()
: is_functional_(false) {
    // create the factory and model
    factory_ = device_factory_ptr(new x10_device_factory(this));
    model_ = device_model_ptr(new device_model(factory_));

    // listen to the model's signals
    model_->device_updated.connect(
        this, &mochad_device_system::on_device_updated);
    //
    model_->device_removed.connect(
        this, &mochad_device_system::on_device_removed);

    // controller_.message_received.connect(
    //     this, &mochad_device_system::on_message_received);

    is_functional_ = controller_.init();
}

mochad_device_system::~mochad_device_system() {
    controller_.deinit();
    is_functional_ = false;
}

void mochad_device_system::on_message_received(const char **params, int count) {
    if (count > 1) {
        // device address is always the second param
        std::string address(params[1]);
        device_ptr device = model().find_by_address(address);
        if (device) {
            x10_device* pdevice = dynamic_cast<x10_device*>(device.get());
            if ( ! pdevice) {
                return;
            }

            std::vector<std::string> param_list;
            for (int i = 0; i < count; i++) {
                param_list.push_back(std::string(params[i]));
            }

            pdevice->on_controller_message(param_list);
        }
    }
}

device_model& mochad_device_system::model() {
    return *model_.get();
}

void mochad_device_system::requery_device_status(const std::string& address) {
    controller_.get_device_status(address.c_str());
}

bool mochad_device_system::send_device_message(command_type message_type, const char* message_params) {
    return controller_.send_device_message(
        (message_type == powerline_command) ? "sendplc" : "sendrf", message_params);
}

void mochad_device_system::on_device_removed(database_id id) {
    x10_device_factory* x10_factory = (x10_device_factory*) factory_.get();
    x10_factory->device_removed(id);
}

void mochad_device_system::on_device_updated(database_id id) {
    x10_device_factory* x10_factory = (x10_device_factory*) factory_.get();
    x10_factory->device_updated(id);
}
