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
	sleep(5000);
	autom8_rpc("{\"component\": \"server\", \"command\": \"stop\"}", 0);
	sleep(1000);
	autom8_deinit();
	printf("\nautom8-cli finished...\n");
	getchar();
	return 0;
}

