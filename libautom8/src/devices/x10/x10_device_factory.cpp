#include "x10_device_factory.hpp"
#include "x10_device_system.hpp"
#include "x10_appliance.hpp"
#include "x10_lamp.hpp"
#include "x10_security_sensor.hpp"

using namespace autom8;

x10_device_factory::x10_device_factory(x10_device_system* owner)
: owner_(owner) {
}

device_ptr x10_device_factory::create(
    database_id id,
    device_type type,
    const std::string& address,
    const std::string& label)
{
    {
        boost::mutex::scoped_lock lock(id_device_map_mutex_);

        id_device_map::iterator it = id_device_map_.find(id);
        if (it != id_device_map_.end()) {
            device_ptr device = it->second;

            if (type == device->type()) {
                x10_device* x10 = (x10_device*) device.get();
                x10->update(address, label);
                return it->second;
            }
        }
    }

    device_ptr result;

    switch (type) {
    case device_type_lamp:
        result = device_ptr(new x10_lamp(owner_, id, address, label));
        break;
    case device_type_appliance:
        result = device_ptr(new x10_appliance(owner_, id, address, label));
        break;
    case device_type_security_sensor:
        result = device_ptr(new x10_security_sensor(owner_, id, address, label));
        break;
            
    default:
        break;
    }

    if (result) {
        boost::mutex::scoped_lock lock(id_device_map_mutex_);
        id_device_map_[id] = result;
    }

    return result;
}

std::string x10_device_factory::name() const {
    return owner_->controller_type();
}

void x10_device_factory::device_removed(database_id id) {
    boost::mutex::scoped_lock lock(id_device_map_mutex_);

    id_device_map::iterator it = id_device_map_.find(id);
    if (it != id_device_map_.end()) {
         id_device_map_.erase(it);
    }
}

void x10_device_factory::device_updated(database_id id) {

}
