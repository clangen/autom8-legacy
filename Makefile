#CXX := clang++
#LLVMCONFIG := /usr/bin/llvm-config-3.3
#DEFAULT_INCLUDES := -I$(shell $(LLVMCONFIG) --src-root)/tools/clang/include -I$(shell $(LLVMCONFIG) --obj-root)/tools/clang/include $(shell $(LLVMCONFIG) --cxxflags)
#LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
#CXXFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -fexceptions -Wno-extra-tokens -g
#LIBRARY_FLAGS := -lsqlite3 -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread

#CXX := arm-linux-gnueabihf-g++
#DEFAULT_INCLUDES := -I$(HOME)/raspberrypi/rootfs/usr/include -I$(HOME)/raspberrypi/rootfs/usr/include/arm-linux-gnueabihf
#DEFAULT_LIBRARIES := -L$(HOME)/raspberrypi/rootfs/usr/lib -L$(HOME)/raspberrypi/rootfs/usr/lib/arm-linux-gnueabihf
#LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
#CXXFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -fexceptions -Wno-extra-tokens -fPIC
#LIBRARY_FLAGS := $(DEFAULT_LIBRARIES) -licuuc -licudata -licui18n -lsqlite3 -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread

CXX := g++
DEFAULT_INCLUDES :=
LOCAL_INCLUDES := -I./3rdparty/include -I./libautom8/src
CXXFLAGS := $(DEFAULT_INCLUDES) $(LOCAL_INCLUDES) -fexceptions -g
LIBRARY_FLAGS := -lsqlite3 -lpthread -lssl -lcrypto -lboost_system -lboost_regex -lboost_date_time -lboost_filesystem -lboost_thread

SOURCES = \
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

OBJECTS = $(SOURCES:%.cpp=%.o)

all: $(OBJECTS)
	$(CXX) -o autom8_cli/autom8_cli $(OBJECTS) $(LIBRARY_FLAGS)
	$(CXX) -shared -o libautom8.so $(OBJECTS) $(LIBRARY_FLAGS)
#	scp libautom8.so pi@192.168.1.245:/home/pi/src/autom8/
#	scp autom8_cli/autom8_cli pi@192.168.1.245:/home/pi/src/autom8/autom8_cli
#	scp autom8_server_node/* pi@192.168.1.245:/home/pi/src/autom8/autom8_server_node

%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(LOCAL_INCLUDES) -c -o $@ $<

clean:
	-rm -f $(OBJECTS) *~
	-rm autom8_cli/autom8_cli
