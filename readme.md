# autom8 #

Turn on lights and monitor security sensors in your house, from your phone.

autom8 is a home automation client and server I've been hacking on since my friend gave me some spare parts in 2007.

It's really useful if you happen to own the supported hardware. 

The autom8 server runs in both Windows and Linux. It runs best on a **Raspberry Pi with Raspbian Jessie**.

## License ##

Standard 3-clause BSD

## Supported hardware ##

* X10 CM15A device controller
* WGL V572RF32 transceiver
* LM456 lamp module
* AM466 appliance module
* DS10A door/window sensor
* MS10A motion detector
* And probably more generic x10 sensors... but untested

## Screenshots ##

![server ui](https://raw.githubusercontent.com/clangen/clangen-projects-static/master/autom8/screenshots/autom8_server_01.png)
![web client ui](https://raw.githubusercontent.com/clangen/clangen-projects-static/master/autom8/screenshots/autom8_client_01.png)
![android ui 01](https://raw.githubusercontent.com/clangen/clangen-projects-static/master/autom8/screenshots/autom8_android_01.png)
![android ui 02](https://raw.githubusercontent.com/clangen/clangen-projects-static/master/autom8/screenshots/autom8_android_02.png)

## Compiling ##

To compile you need to check out the sources. Make sure git is installed, then:

* `cd ~/src/`
* `git clone git@github.com:clangen/autom8.git`
 
### autom8 client for Android ###

The autom8 Android app makes use of the [Retrolambda Gradle plugin](https://github.com/evant/gradle-retrolambda). Make make sure you have JDK 8 installed, and have set the JAVA8_HOME environment variable appropriately.

1. Install Android Studio 2.0 or newer.
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

1. Visual Studio 2015 with the 32-bit C++ compiler (https://www.visualstudio.com/en-us/products/visual-studio-community-vs.aspx)
2. Boost 1.60 (https://sourceforge.net/projects/boost/files/boost-binaries/1.60.0/)
3. QT 5.7 with 32-bit MSVC2015 libraries (http://download.qt.io/official_releases/online_installers/qt-unified-windows-x86-online.exe)
4. Qt5Package VS Addin (https://visualstudiogallery.msdn.microsoft.com/c89ff880-8509-47a4-a262-e4fa07168408)
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

That is: autom8 and boost should share the same parent directory.

#### Compile ####

1. Open <autom8-src>/autom8.sln
2. Configure the Qt5Package Addin:
    - Main Menu -> QT -> Qt Options
    - Qt Version -> Add
        - Name: 5.7
        - Path: d:\path\to\Qt\5.7\msvc2015 
3. Configure the QTDIR environment variable:
    - Main Menu -> View -> Other Windows -> Property Manager
    - autom8_server_qt -> Debug | Win32
    - Double click QtConfig
    - User Macros
        - Name: QTDIR
        - Value: d:\path\to\Qt\5.7\msvc2015
4. Compile and Run

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

1. tar xvfz mochad-0.1.16.tar.gz 
2. cd mochad-0.1.16
3. ./configure
4. make
5. sudo make install

##### Compile libautom8.so and server, and install #####

1. cd ~/src/autom8
2. ./bin/build
3. cd build/
4. sudo ./install -p /opt/autom8/

**Note 1**: `bin/build` is a shell script that will do the following:

1. Run `make` to compile `libautom8.so`
2. Run `grunt` to compile the admin and web clients
3. Stage all files required for distribution to `build/stage`
4. Copy an `install` script to `build/`

**Note 2**: `build/install` is a shell script that will:

1. Create a new user as specified by the `-u` parameter (defaults to `autom8`). the autom8 server will be run as this user, and device configuration will be stored in the `~/user/.autom8`.
2. Use npm to compile and install all required node dependencies for the app to run
3. Install an init script called `autom8-server` to `/etc/init.d/` so you can run autom8 automatically at boot
4. Copy (install) all required files to the path specified by the required `-p` parameter. `-p /opt/autom8` is recommended.

##### Start the server #####

* sudo /etc/init.d/autom8-server start

If you want to start the server on boot:

* sudo update-rc.d autom8-server defaults 99

## SSL ##

If you're using the autom8 Linux server then you can easily configure port numbers and SSL certificates.

Edit **/opt/autom8/share/autom8/config.json** (note, you can also copy it to **/etc/autom8/config.json**, which will take precedence). Update the **cert** and **key** values to point towards your preferred credentials.

## Troubleshooting ##

* Q1: I'm having problems installing nodejs on my older Raspberry Pi
* A1: It's probably because you need an ARM V6 build. Try to use this deb: http://node-arm.herokuapp.com/node_latest_armhf.deb
* Q2: The server doesn't seem to be starting
* A2: Tail the logs and try to start it again, hopefully you will get some useful diagnostic output. `tail -f /tmp/autom8.log`
