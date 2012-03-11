#ifndef __C_AUTOM8_DEVICE_MODEL_HPP__
#define __C_AUTOM8_DEVICE_MODEL_HPP__

#include <boost/shared_ptr.hpp>
#include <boost/thread.hpp>
#include "device_factory.hpp"
#include <sqlite/sqlite3.h>
#include <sigslot/sigslot.h>

namespace autom8 {
    class device_model {
    public:
        device_model(device_factory_ptr factory);
        virtual ~device_model();

        sigslot::signal1<device_ptr> device_added;
        sigslot::signal1<database_id> device_removed;
        sigslot::signal1<database_id> device_updated;

        virtual device_ptr add(
            device_type type,
            const std::string& address,
            const std::string& label);

        virtual bool remove(device_ptr device);
        virtual bool remove(database_id id);

        virtual bool update(device_ptr device);
        virtual bool update(
            database_id id,
            device_type type,
            const std::string& address,
            const std::string& label);

        virtual int all_devices(device_list& target);
        virtual device_ptr find_by_address(const std::string& address);

    protected:
        void create_table();
        sqlite3* connection() { return connection_; }
        device_factory_ptr factory() { return factory_; }

        virtual void on_device_added(device_ptr new_device);
        virtual void on_device_removed(database_id old_device_id);
        virtual void on_device_updated(database_id id);

    private:
        device_factory_ptr factory_;
        std::string table_name_;
        sqlite3* connection_;
        boost::mutex connection_mutex_;
    };

    typedef boost::shared_ptr<device_model> device_model_ptr;
}

#endif // __C_AUTOM8_DEVICE_MODEL_HPP__