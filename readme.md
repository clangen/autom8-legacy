# autom8

autom8 is a simple home automation client and server that I started developing after I graduated college in 2008. It's sort of fallen behind the times, but is still really useful if you already have the hardware. It allows you to turn lights and appliances on and off, and monitor security sensors from your phone.

I also used autom8 as a test bed for technology I wanted to experiment with over the years; as such, it has a number of components written in different languages and technologies. Sometimes it shows.

## license

todo

## hardware

Supported hardware includes:
* x10 cm15a device controller
* wgl v572rf32 transceiver
* lm456 lamp module
* am466 appliance module
* ds10a door/window sensor
* ms10a motion detector
* probably more generic x10 sensors... but untested

## compiling

### android client

Compiling the Android client is super easy:

1. Install Android Studio 2.0 Beta 6 or newer.
1. Import the project
1. Build and Run

### windows server

#### pre-reqs
If you want to compile the Windows server you need the following:

1. Visual Studio 2010 with Service Pack 1
2. Boost 1.60 (https://sourceforge.net/projects/boost/files/boost-binaries/1.60.0/)
3. QT 4.8.6 (https://download.qt.io/archive/qt/4.8/4.8.6/qt-opensource-windows-x86-vs2010-4.8.6.exe)
4. QT Visual Studio Addin 1.1.11 (http://download.qt.io/official_releases/vsaddin/qt-vs-addin-1.1.11-opensource.exe)
4. ActiveHome Pro SDK (http://www.starbasestudios.net/ahk/ahsdk_install.exe)

All other dependencies are included.

The Visual Studio Solution (.sln) assumes the following relative paths:

1. Boost is installed to: <autom8-src>/../boost_1_60_0/
2. QT is installed to: <autom8-src>/../qt_4.8.6/

In other words, autom8, Boost and QT share the same root directory.

#### compile

1. Open <autom8-src>/autom8.sln
2. Compile and run!

### linux server with web ui

#### intall debian jessie

Use the 32-bit desktop iso. you can also use a Raspberry Pi with Raspbian!

##### install system-level dependencies:

* sudo apt-get install build-essential clang llvm libboost-chrono-dev libboost-system-dev libboost-regex-dev libboost-date-time-dev libboost-filesystem-dev libboost-thread-dev libssl-dev libsqlite3-dev libusb-1.0-0-dev

##### install nodejs and grunt

Note: the default apt-supplied version of nodejs is too old; install v4.4.

1. curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
2. sudo apt-get install -y nodejs
3. npm install -g grunt grunt-cli

##### install mochad (cm15a "driver"):

1. Download, extract the sources (https://sourceforge.net/projects/mochad/files/mochad-0.1.16.tar.gz/download)
2. ./configure
3. make
4. sudo make install

##### compile libautom8.so, stage, and install

1. cd ~/src/autom8
2. ./bin/stage
3. cd build
4. sudo ./install -p /opt/autom8/

##### start the server

* /etc/init.d/autom8-server start

## SSL

If you're using the autom8 Linux server then you can easily configure the port numbers and certificates used by the HTTPS servers.

Simply edit your **/opt/autom8/share/autom8/config.json** (note, you can also copy it to **/etc/autom8/config.json**) and update the **cert** and **key** values to point towards your preferred credentials.