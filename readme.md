# autom8 #

Turn on lights and monitor security sensors in your house, from your phone.

autom8 is a home automation client and server I've been hacking on since my friend gave me some spare parts in 2007.

It's really useful if you happen to own the supported hardware. 

The autom8 server runs in both Windows and Linux. It loves running on a **Raspberry Pi with Raspbian Jessie**.

## license ##

standard 3-clause bsd

## supported hardware ##

* x10 cm15a device controller
* wgl v572rf32 transceiver
* lm456 lamp module
* am466 appliance module
* ds10a door/window sensor
* ms10a motion detector
* probably more generic x10 sensors... but untested

## compiling ##

### autom8 client for Android ###

1. Install Android Studio 2.0 Beta 6 or newer.
2. Import the project
3. Build and Run

### autom8 server for Windows ###

System diagram:

    +--------------------------------------------------------+
    |                   android client                       |
    +--------------------------^-----------------------------+
                               |
    +--------------------------v-----------------------------+
    |           main server (autom8_server_ui.exe)           |
    +--------------------------^-----------------------------+
                               |
    +--------------------------v-----------------------------+
    |                    libautom8.dll                       |
    +----------^---------------------------------------------+
               |
    +----------v-----------+  +------------------------------+
    |  ActiveHome Pro SDK  <-->     x10 cm15a controller     |
    +----------------------+  +------------------------------+

The server listens on TCP port 7901 by default.

#### Install these things: ####

1. Visual Studio 2010 with Service Pack 1
2. Boost 1.60 (https://sourceforge.net/projects/boost/files/boost-binaries/1.60.0/)
3. QT 4.8.6 (https://download.qt.io/archive/qt/4.8/4.8.6/qt-opensource-windows-x86-vs2010-4.8.6.exe)
4. QT Visual Studio Addin 1.1.11 (http://download.qt.io/official_releases/vsaddin/qt-vs-addin-1.1.11-opensource.exe)
5. ActiveHome Pro SDK (http://www.starbasestudios.net/ahk/ahsdk_install.exe)

All other dependencies are included in the source.

The Visual Studio Solution (autom8.sln) assumes the following directory structure:

    ./
    ../
        autom8/
            autom8.sln
            ...
        boost_1_60_0/
            ...
        qt_4.8.6/
            ...

That is: autom8, Boost and QT sources all share the same parent directory.

#### Compile ####

1. Open <autom8-src>/autom8.sln
2. Compile and Run

### autom8 Server for Linux (with web-based admin and client app) ###

System diagram:

    +--------------+  +--------------+  +--------------------+
    |  web client  |  | admin client |  |   android client   |
    +-------^------+  +-------^------+  +----------^---------+
            |                 |                    |
    +-------v-----------------v--------------------v---------+
    |                main server (autom8.js)                 |
    +---------------------------^----------------------------+
                                |
    +---------------------------v----------------------------+
    |                   node.js / C bridge                   |
    +---------------------------^----------------------------+
                                |
    +---------------------------v----------------------------+
    |                      libautom8.so                      |
    +--------^-----------------------------------------------+
             |
    +--------v-------+  +------------------------------------+
    |     mochad     <-->        x10 cm15a controller        |
    +----------------+  +------------------------------------+

Ports the main server listens on by default:

* native/android client: TCP/7901
* web client: HTTPS/7902
* admin client: HTTPS/7903

#### Intall Debian Jessie ####

autom8 works well on Debian Jessie.

 It works especially well on a **Raspberry Pi running Raspbian Jessie.**

##### Install system-level dependencies: ####

* sudo apt-get install build-essential clang llvm libboost-chrono-dev libboost-system-dev libboost-regex-dev libboost-date-time-dev libboost-filesystem-dev libboost-thread-dev libssl-dev libsqlite3-dev libusb-1.0-0-dev

##### Install nodejs and grunt #####

The default apt-supplied version of nodejs is too old; **install version v4.4**.

1. curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
2. sudo apt-get install -y nodejs
3. sudo npm install -g grunt grunt-cli

##### Install mochad (the X10 CM15A "driver"): #####

https://sourceforge.net/projects/mochad/files/mochad-0.1.16.tar.gz/download

* tar xvfz mochad-0.1.16.tar.gz; cd mochad-0.1.16; ./configure; make; sudo make install

##### Compile libautom8.so, stage, and install #####

1. cd ~/src/autom8
2. make
3. ./bin/stage
4. cd build
5. sudo ./install -p /opt/autom8/

##### Start the server #####

* /etc/init.d/autom8-server start

If you want to start the server on boot:

* sudo update-rc.d autom8-server defaults 99

## SSL ##

If you're using the autom8 Linux server then you can easily configure port numbers and SSL certificates.

Edit **/opt/autom8/share/autom8/config.json** (note, you can also copy it to **/etc/autom8/config.json**, which will take precedence). Update the **cert** and **key** values to point towards your preferred credentials.