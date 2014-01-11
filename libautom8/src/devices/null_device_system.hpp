#ifndef __C_AUTOM8_NULL_DEVICE_SYSTEM_HPP__
#define __C_AUTOM8_NULL_DEVICE_SYSTEM_HPP__

#include "device_system.hpp"

namespace autom8 {
    class null_device_system: public device_system {
    public:
        null_device_system(): model_(device_factory_ptr(new null_device_factory())) { }
        virtual std::string description() { return "null/mock"; }
        virtual device_model& model() { return model_; }

    private:
        class null_device_factory: public device_factory {
        public:
            virtual device_ptr create(
                database_id id,
                device_type type,
                const std::string& address,
                const std::string& label,
                const std::vector<std::string>& groups
            );

            virtual std::string name() const;
        };

    private:
        device_model model_;
    };
}

#endif