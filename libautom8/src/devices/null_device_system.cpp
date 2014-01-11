#include "null_device_system.hpp"
#include "device_base.hpp"
#include "simple_device.hpp"

#include <server.hpp>
#include <common_messages.hpp>

using namespace autom8;

class null_device: public simple_device, public lamp, public security_sensor {
public:
    null_device(
        database_id id,
        const std::string& address,
        const std::string& label,
        const std::vector<std::string>& groups = std::vector<std::string>(),
        device_type type = device_type_unknown)
        : simple_device(id, address, label, groups)
        , type_(type)
        , brightness_(100)
        , armed_(true)
        , tripped_(false)
    {

    }

    virtual void on_status_changed() {
        simple_device::on_status_changed();
        server::send(messages::responses::device_status_updated(shared_from_this()));

        if (type_ == device_type_security_sensor) {
            server::send(messages::responses::sensor_status_changed(shared_from_this()));
        }
    }

    /* device base */
    void get_extended_json_attributes(json_value& target) {
        if (type_ == device_type_lamp) {
            target["brightness"] = brightness_;
        }
        else if (type_ == device_type_security_sensor) {
            target["armed"] = armed_;
            target["tripped"] = tripped_;
        }
    }

    /* simple device */
    virtual device_type type() {
        return type_;
    }

    virtual void turn_on() {
        if (status_ != device_status_on) {
            status_ = device_status_on;
            on_status_changed();
        }
    }

    virtual void turn_off() {
        if (status_ != device_status_off) {
            status_ = device_status_off;
            on_status_changed();
        }
    }

    /* lamp */
    virtual int brightness() {
        return brightness_;
    }

    virtual void set_brightness(int brightness) {
        if (brightness != brightness_) {
            brightness_ = brightness;
            on_status_changed();
        }
    };

    /* security_sensor */
    virtual void arm() {
        if (!armed_ || status_ != device_status_on) {
            armed_ = true;
            status_ = device_status_on;
            on_status_changed();
        }
    }

    virtual void disarm() {
        if (armed_ || status_ == device_status_on) {
            armed_ = false;
            status_ = device_status_off;
            on_status_changed();
        }
    }

    virtual void reset() {
        if (tripped_) {
            tripped_ = false;
            on_status_changed();
        }
    }

    virtual bool is_armed() {
        return armed_;
    }

    virtual bool is_tripped() {
        return tripped_;
    }

private:
    device_type type_;
    int brightness_;
    bool armed_, tripped_;
};

device_ptr null_device_system::null_device_factory::create(
    database_id id,
    device_type type,
    const std::string& address,
    const std::string& label,
    const std::vector<std::string>& groups)
{
    return device_ptr(new null_device(id, address, label, groups, type));
}

std::string null_device_system::null_device_factory::name() const {
    return "null";
}