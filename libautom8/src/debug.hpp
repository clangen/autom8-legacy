#ifndef __C_AUTOM8_DEBUG_HPP__
#define __C_AUTOM8_DEBUG_HPP__

#include <sigslot/sigslot.h>

namespace autom8 {
    class debug {
    public:
		enum debug_level {
			info,
			warning,
			error
		};

		static void init();
		static void deinit();
        static sigslot::signal3<debug_level, std::string, std::string> string_logged;
        static void log(debug_level level, const std::string& tag, const std::string& string);
    };
}

#endif // __C_AUTOM8_DEBUG_HPP__