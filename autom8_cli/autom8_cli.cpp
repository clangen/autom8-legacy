#include "stdafx.h"

#include <autom8.hpp>

#ifdef WIN32
#include <Windows.h>
#define sleep Sleep
#endif

int main(int argc, char* argv[])
{
	printf("library version: %s\n\n", autom8_version());

	autom8_server_start();
	sleep(5000);
	autom8_server_stop();

	printf("\nautom8-cli finished...\n");
	getchar();

	return 0;
}

