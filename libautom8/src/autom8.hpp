#ifndef __C_AUTOM8_HPP__
#define __C_AUTOM8_HPP__

#include "export.h"

/* args: level, tag, value */
typedef void (*log_func)(int, const char*, const char*);

extern "C" {
	dll_export const char* autom8_version();
	dll_export void autom8_set_logger(log_func);
	dll_export int autom8_server_start();
	dll_export int autom8_server_stop();
}

#endif // __C_AUTOM8_HPP__