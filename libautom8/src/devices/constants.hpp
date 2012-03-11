#ifndef __C_AUTOM8_DEVICE_CONSTANTS_HPP__
#define __C_AUTOM8_DEVICE_CONSTANTS_HPP__

namespace autom8 {
    enum device_type {
        device_type_unknown = -1,
        device_type_lamp = 0,
        device_type_appliance = 1,
        device_type_security_sensor = 2
    };

    enum command_type {
        powerline_command = 0,
        radio_frequency_command = 1
    };

    enum device_status {
        device_status_unknown = -1,
        device_status_off = 0,
        device_status_on = 1
    };

    typedef long long database_id;
}

#endif // __C_AUTOM8_DEVICE_CONSTANTS_HPP__