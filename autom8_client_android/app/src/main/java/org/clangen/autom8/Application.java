package org.clangen.autom8;

import org.clangen.autom8.device.DeviceLibraryFactory;

public class Application extends android.app.Application {
    @Override
    public void onCreate() {
        DeviceLibraryFactory.getInstance(this).clear();
        super.onCreate();
    }
}
