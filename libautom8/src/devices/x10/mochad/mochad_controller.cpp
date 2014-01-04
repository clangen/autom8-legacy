#include "mochad_controller.hpp"

using namespace autom8;

mochad_controller::mochad_controller() {
    running_ = false;
}

mochad_controller::~mochad_controller() {
    deinit();
}

bool mochad_controller::init() {
    if (!running_) {
        io_thread_.reset(
            new boost::thread(boost::bind(
                &mochad_controller::io_thread_proc,
                this
            ))
        );

        running_ = true;
    }

    return true;
}

void mochad_controller::deinit() {
    io_service_.stop();
    running_ = false;
}

void mochad_controller::io_thread_proc() {
    io_service_.run();
}

bool mochad_controller::send_device_message(const char* message_type, const char* message_params) {
    return true;
}

bool mochad_controller::get_device_status(const char* device_address) {
    return true;
}
