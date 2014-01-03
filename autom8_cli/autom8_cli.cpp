#include "stdafx.h"

#include <autom8.hpp>

#ifdef WIN32
#include <Windows.h>
#define sleep Sleep
#endif

int main(int argc, char* argv[])
{
	autom8_init();
	printf("library version: %s\n\n", autom8_version());
	autom8_rpc("{\"component\": \"server\", \"command\": \"start\"}", 0);
	autom8_rpc("{\"component\": \"system\", \"command\": \"list\"}", 0);
	autom8_rpc("{\"component\": \"system\", \"command\": \"current\"}", 0);
	autom8_rpc("{\"component\": \"system\", \"command\": \"add_device\", \"options\": { \"label\": \"office\", \"type\": 0, \"address\": \"a1\" } }", 0);
	autom8_rpc("{\"component\": \"system\", \"command\": \"list_devices\" }", 0);
	sleep(5000);
	autom8_rpc("{\"component\": \"server\", \"command\": \"stop\"}", 0);
	sleep(1000);
	autom8_deinit();
	printf("\nautom8-cli finished...\n");
	getchar();

	return 0;
}

