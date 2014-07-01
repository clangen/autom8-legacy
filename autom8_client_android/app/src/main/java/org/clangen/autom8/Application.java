package org.clangen.autom8;

import org.clangen.autom8.db.DeviceLibrary;

public class Application extends android.app.Application {
    @Override
    public void onCreate() {
        DeviceLibrary.getInstance(this).clear();
        super.onCreate();
    }
}
