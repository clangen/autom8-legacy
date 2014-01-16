#C := clang
#CXX := clang++
#LLVMCONFIG := /usr/bin/llvm-config-3.4
#DEFAULT_INCLUDES := -I$(shell $(LLVMCONFIG) --src-root)/tools/clang/include -I$(shell $(LLVMCONFIG) --obj-root)/tools/clang/include $(shell $(LLVMCONFIG) --cxxflags)
#LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
#CFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -Wno-extra-tokens -g
#CXXFLAGS := $(CFLAGS) -fexceptions
#LIBRARY_FLAGS := -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread
#LD_FLAGS := -shared -o libautom8.so

# cross compile
C := arm-linux-gnueabihf-gcc
CXX := arm-linux-gnueabihf-g++
DEFAULT_INCLUDES := -I$(HOME)/raspberrypi/rootfs/usr/include -I$(HOME)/raspberrypi/rootfs/usr/include/arm-linux-gnueabihf
DEFAULT_LIBRARIES := -L$(HOME)/raspberrypi/rootfs/usr/lib -L$(HOME)/raspberrypi/rootfs/usr/lib/arm-linux-gnueabihf
LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src -g
CFLAGS := $(LOCAL_INCLUDES) $(DEFAULT_INCLUDES)  -Wno-extra-tokens -fPIC
CXXFLAGS := $(CFLAGS) -fexceptions
LIBRARY_FLAGS := $(DEFAULT_LIBRARIES) -licuuc -licudata -licui18n -lsqlite3 -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread
LD_FLAGS := -shared -o libautom8.so

# linux
#C := gcc
#CXX := g++
#DEFAULT_INCLUDES :=
#LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
#CFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -g
#CXXFLAGS := $(CFLAGS) -fexceptions
#LIBRARY_FLAGS := -lsqlite3 -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread
#LD_FLAGS := -shared -o libautom8.so

# mac: WARNING! using "-undefined suppress -flat_namespace" will cause problems
# when using node.js with ffi. specifically: memory allocation issues and random
# segfaults. why? who knows...
#C := clang
#CXX := clang++
#DEFAULT_INCLUDES :=
#DEFAULT_LIBRARIES := -L/usr/local/lib
#LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
#CFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -g
#CXXFLAGS := $(CFLAGS) -fexceptions
#LIBRARY_FLAGS := $(DEFAULT_LIBRARIES) -lpthread -lssl -lcrypto -lboost_system-mt -lboost_regex-mt -lboost_date_time-mt -lboost_filesystem-mt -lboost_thread-mt
#LD_FLAGS := -dynamiclib -o libautom8.dylib

C_SOURCES = \
	3rdparty/src/sqlite/sqlite3.c

CXX_SOURCES = \
	3rdparty/src/lib_json/json_reader.cpp \
	3rdparty/src/lib_json/json_writer.cpp \
	3rdparty/src/lib_json/json_value.cpp \
	3rdparty/src/base64/base64.cpp \
	libautom8/src/client.cpp \
	libautom8/src/common_messages.cpp \
	libautom8/src/db.cpp \
	libautom8/src/debug.cpp \
	libautom8/src/json.cpp \
	libautom8/src/message.cpp \
	libautom8/src/preferences.cpp \
	libautom8/src/request.cpp \
	libautom8/src/request_handler_factory.cpp \
	libautom8/src/request_handler_registrar.cpp \
	libautom8/src/response.cpp \
	libautom8/src/server.cpp \
	libautom8/src/session.cpp \
	libautom8/src/ssl_certificate.cpp \
	libautom8/src/utility.cpp \
	libautom8/src/devices/device_base.cpp \
	libautom8/src/devices/device_model.cpp \
	libautom8/src/devices/device_system.cpp \
	libautom8/src/devices/simple_device.cpp \
	libautom8/src/devices/null_device_system.cpp \
	libautom8/src/devices/x10/x10_appliance.cpp \
	libautom8/src/devices/x10/x10_device.cpp \
	libautom8/src/devices/x10/x10_device_factory.cpp \
	libautom8/src/devices/x10/x10_lamp.cpp \
	libautom8/src/devices/x10/x10_security_sensor.cpp \
	libautom8/src/devices/x10/mochad/mochad_controller.cpp \
	libautom8/src/devices/x10/mochad/mochad_device_system.cpp \
	libautom8/src/requests/get_device_list.cpp \
	libautom8/src/requests/get_security_alert_count.cpp \
	libautom8/src/requests/send_device_command.cpp \
	libautom8/src/autom8.cpp \
	autom8_cli/autom8_cli.cpp

CXX_OBJECTS = $(CXX_SOURCES:%.cpp=%.o)
C_OBJECTS = $(C_SOURCES:%.c=%.o)

all: $(C_OBJECTS) $(CXX_OBJECTS)
	#$(CXX) -o autom8_cli/autom8_cli $(C_OBJECTS) $(CXX_OBJECTS) $(LIBRARY_FLAGS)
	$(CXX) $(LD_FLAGS) $(C_OBJECTS) $(CXX_OBJECTS) $(LIBRARY_FLAGS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c -o $@ $<

%.o: %.c
	$(C) $(CFLAGS) -c -o $@ $<

push: all
	scp libautom8.so pi@autom8:/home/pi/src/autom8/
#	scp autom8_cli/autom8_cli pi@autom8:/home/pi/src/autom8/autom8_cli
#	scp -r autom8_node/server/frontend/* pi@autom8:/home/pi/src/autom8/autom8_node/server/frontend
#	scp -r autom8_node/server/backend/* pi@autom8:/home/pi/src/autom8/autom8_node/server/backend

clean:
	-rm -f $(CXX_OBJECTS) $(C_OBJECTS) *~
	-rm autom8_cli/autom8_cli
	-rm libautom8.so
	-rm libautom8.dylib
