#ifndef __C_AUTOM8_REQUEST_HANDLER_GET_SECURITY_ALERT_COUNT_HPP__
#define __C_AUTOM8_REQUEST_HANDLER_GET_SECURITY_ALERT_COUNT_HPP__

#include <request_handler.hpp>
#include <session.hpp>

namespace autom8 {
    class get_security_alert_count: public request_handler {
    public:
        static request_handler_ptr create();
        virtual bool can_handle(session_ptr, message_ptr);
        virtual void operator()(session_ptr, message_ptr);
    };
}

#endif // __C_AUTOM8_REQUEST_HANDLER_GET_SECURITY_ALERT_COUNT_HPP__