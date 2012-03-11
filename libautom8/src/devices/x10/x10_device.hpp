#ifndef __C_AUTOM8_X10_DEVICE_HPP__
#define __C_AUTOM8_X10_DEVICE_HPP__

#include <boost/shared_ptr.hpp>

#include "x10_device_system.hpp"

namespace autom8 {
    class x10_device_system;

    class x10_device: public device_base {
    public:
        x10_device(
            x10_device_system* owner,
            database_id id,
            const std::string& address,
            const std::string& label);

        virtual ~x10_device();

        virtual void on_controller_message(const std::vector<std::string>& status_values);
        virtual device_status status();
        virtual std::string address();
        virtual std::string label();
        virtual database_id id();
        virtual void turn_on();
        virtual void turn_off();

        virtual void update(
            const std::string& new_address,
            const std::string& new_label);

        virtual device_type type() = 0;

    protected:
        x10_device_system* owner() { return owner_; }
        virtual void set_device_status(device_status new_status);

    private:
        std::string label_, address_;
        x10_device_system* owner_;
        device_status status_;
        database_id id_;
    };
}

#endif // __C_AUTOM8_X10_DEVICE_HPP__