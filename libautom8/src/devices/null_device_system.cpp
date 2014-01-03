#include "null_device_system.hpp"
#include "device_base.hpp"
#include "simple_device.hpp"

using namespace autom8;

class null_device: public simple_device {
public:
    null_device(
        database_id id,
        const std::string& address,
        const std::string& label,
		const std::vector<std::string>& groups = std::vector<std::string>())
		: simple_device(id, address, label, groups)
	{
			
	}

    virtual device_type type() {
		return device_type_lamp;
	}

	virtual void turn_on() {
	}

    virtual void turn_off() {
	}
};

device_ptr null_device_system::null_device_factory::create(
    database_id id,
	device_type type,
	const std::string& address,
	const std::string& label,
	const std::vector<std::string>& groups)
{ 
	return device_ptr(new null_device(id, address, label, groups));
}

std::string null_device_system::null_device_factory::name() const {
	return "null";
}