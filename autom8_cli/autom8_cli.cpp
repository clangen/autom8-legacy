#include "stdafx.h"

#include <autom8.hpp>

#ifdef WIN32
#include <Windows.h>
#define sleep(x) Sleep(x * 1000)
#else
#include <unistd.h>
#endif

int main(int argc, char* argv[])
{
    autom8_init();
    printf("library version: %s\n\n", autom8_version());
    autom8_rpc("{\"component\": \"server\", \"command\": \"set_preference\", \"options\": { \"key\": \"password\", \"value\": \"c66247c6abc4c8d745969b4ea11674c7ad8579a40ce1e5da01ff3a845dc72d35\" } }", 0);
    autom8_rpc("{\"component\": \"server\", \"command\": \"get_preference\", \"options\": { \"key\": \"password\" } }", 0);
    autom8_rpc("{\"component\": \"server\", \"command\": \"start\"}", 0);
    autom8_rpc("{\"component\": \"system\", \"command\": \"list\"}", 0);
    autom8_rpc("{\"component\": \"system\", \"command\": \"current\"}", 0);
    autom8_rpc("{\"component\": \"system\", \"command\": \"add_device\", \"options\": { \"label\": \"office\", \"type\": 0, \"address\": \"a1\" } }", 0);
    autom8_rpc("{\"component\": \"system\", \"command\": \"list_devices\" }", 0);
    sleep(60);
    autom8_rpc("{\"component\": \"server\", \"command\": \"stop\"}", 0);
    autom8_deinit();
    printf("\nautom8-cli finished...\n");
    getchar();
    return 0;
}

