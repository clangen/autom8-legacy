#ifndef __C_AUTOM8_HPP__
#define __C_AUTOM8_HPP__

#include "export.h"

/* args: level, tag, value */
typedef void (*log_func)(int, const char*, const char*);
typedef void (*rpc_callback)(const char*);

#define AUTOM8_FALSE 0
#define AUTOM8_TRUE 1

#define AUTOM8_OK 1
#define AUTOM8_UNKNOWN ~0
#define AUTOM8_INVALID_ARGUMENT -1
#define AUTOM8_ERROR_SERVER_RUNNING -2
#define AUTOM8_ERROR_SERVER_STOPPED -3
#define AUTOM8_INVALID_COMMAND -4
#define AUTOM8_ALREADY_INITIALIZED -5
#define AUTOM8_NOT_INITIALIZED -6

#define AUTOM8_COMPONENT_SYSTEM "system"
#define AUTOM8_COMPONENT_SERVER "server"

extern "C" {
	dll_export const char* autom8_version();
	dll_export int autom8_init();
	dll_export int autom8_deinit();
	dll_export int autom8_set_logger(log_func);
	dll_export void autom8_rpc(const char*, rpc_callback);
}

#endif // __C_AUTOM8_HPP__